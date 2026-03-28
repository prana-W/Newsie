"""
StoryArcRouter — Pure AI/RAG logic for semantic article routing.

This module contains NO database access. It communicates with:
  1. ChromaDB Cloud — for semantic similarity search against topic summaries.
  2. Gemini 3 Flash Preview — as a gatekeeper to filter redundant updates.

The Node.js backend calls this service, handles all MongoDB persistence,
and passes existing timeline data when gatekeeper evaluation is needed.
"""

from __future__ import annotations

import logging
import os
import uuid
from urllib.parse import urlparse

import chromadb
from chromadb.config import Settings
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from schemas import GatekeeperOutput, RouteArticleRequest, RoutingResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Similarity Thresholds
# ---------------------------------------------------------------------------
MATCH_THRESHOLD = 0.85
NEW_ARC_THRESHOLD = 0.50

# ---------------------------------------------------------------------------
# Prompt Templates
# ---------------------------------------------------------------------------
GATEKEEPER_SYSTEM_PROMPT = """\
You are a strict editorial gatekeeper for a news timeline system.
You will receive an existing story timeline and a new breaking article.

Your job:
1. Determine if the new article provides a **meaningful, non-redundant**
   update to the story timeline.
2. If YES — write a crisp, 1-sentence new timeline event and extract
   the event date from the article.
3. If NO — simply mark it as irrelevant.

{format_instructions}
"""

GATEKEEPER_USER_PROMPT = """\
## Existing Timeline
{existing_timeline}

## New Breaking Article
{article_text}

Analyze the article against the existing timeline and respond.
"""

TOPIC_SUMMARY_PROMPT = """\
You are a news editor. Read the following article and produce a single,
concise topic summary sentence (max 25 words) that captures the core
subject of the story. This summary will be used to match future related
articles.

Article:
{article_text}

Respond with ONLY the topic summary sentence, nothing else.
"""


class StoryArcRouter:
    """Routes incoming articles to story arcs using semantic similarity
    and an LLM gatekeeper.

    This class is stateless with respect to MongoDB — it only interacts
    with ChromaDB (embeddings) and Gemini (gatekeeper + summarisation).

    Attributes:
        collection: ChromaDB collection storing topic summary embeddings.
        llm: LangChain Gemini chat model instance.
        gatekeeper_parser: PydanticOutputParser for structured gatekeeper output.
        gatekeeper_chain: Composed LangChain chain (prompt | llm | parser).
    """

    def __init__(self) -> None:
        """Initialise ChromaDB client, Gemini LLM, and LangChain chains."""
        # -- ChromaDB Client (cloud or local) ------------------------------
        self.chroma_client = self._build_chroma_client()
        collection_name = os.getenv("CHROMA_COLLECTION", "story_arc_topics")
        self.collection = self.chroma_client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            "ChromaDB collection '%s' ready (%d docs)",
            collection_name,
            self.collection.count(),
        )

        # -- Gemini LLM ----------------------------------------------------
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-3-flash-preview",
            temperature=0.1,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )

        # -- Gatekeeper Chain ----------------------------------------------
        self.gatekeeper_parser = PydanticOutputParser(
            pydantic_object=GatekeeperOutput,
        )
        gatekeeper_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", GATEKEEPER_SYSTEM_PROMPT),
                ("human", GATEKEEPER_USER_PROMPT),
            ]
        )
        self.gatekeeper_chain = (
            gatekeeper_prompt | self.llm | self.gatekeeper_parser
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def _build_chroma_client(self):
        """Create ChromaDB client from environment configuration."""
        mode = os.getenv("CHROMA_MODE", "cloud").strip().lower()

        if mode == "local":
            persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./.chroma")
            logger.info("Using local ChromaDB PersistentClient at %s", persist_dir)
            return chromadb.PersistentClient(path=persist_dir)

        raw_host = os.getenv("CHROMA_HOST", "localhost").strip()
        parsed = urlparse(raw_host if "://" in raw_host else f"https://{raw_host}")
        host = parsed.hostname or raw_host.replace("https://", "").replace("http://", "")

        ssl_env = os.getenv("CHROMA_SSL")
        if ssl_env is None:
            use_ssl = parsed.scheme == "https"
        else:
            use_ssl = ssl_env.strip().lower() in {"1", "true", "yes", "on"}

        default_port = 443 if use_ssl else 8000
        port = int(os.getenv("CHROMA_PORT", str(parsed.port or default_port)))

        api_key = os.getenv("CHROMA_API_KEY", "").strip()
        client_kwargs = {
            "host": host,
            "port": port,
            "ssl": use_ssl,
            "tenant": os.getenv("CHROMA_TENANT", "default_tenant"),
            "database": os.getenv("CHROMA_DATABASE", "default_database"),
        }

        if api_key:
            client_kwargs["settings"] = Settings(
                chroma_client_auth_provider="chromadb.auth.token_authn.TokenAuthClientProvider",
                chroma_client_auth_credentials=api_key,
            )

        logger.info(
            "Using cloud ChromaDB HttpClient host=%s port=%d ssl=%s tenant=%s database=%s",
            client_kwargs["host"],
            client_kwargs["port"],
            client_kwargs["ssl"],
            client_kwargs["tenant"],
            client_kwargs["database"],
        )
        return chromadb.HttpClient(**client_kwargs)

    async def process_new_article(
        self, payload: RouteArticleRequest
    ) -> RoutingResult:
        """Execute the full routing pipeline for a new article.

        Args:
            payload: The article text, ID, and optional existing timeline.

        Returns:
            RoutingResult indicating the action taken and any details.
        """
        arc_id, score = self._find_matching_arc(payload.article_text)

        # Condition B — New Story (similarity < 0.50)
        if score < NEW_ARC_THRESHOLD or arc_id is None:
            topic_summary = await self._generate_topic_summary(
                payload.article_text,
            )
            new_arc_id = str(uuid.uuid4())
            self._upsert_arc_embedding(new_arc_id, topic_summary)
            logger.info(
                "Created new story arc %s (score=%.3f)", new_arc_id, score
            )
            return RoutingResult(
                action="created",
                arc_id=new_arc_id,
                similarity_score=score,
                topic_summary=topic_summary,
            )

        # Ambiguous zone (0.50 – 0.85) — skip
        if score <= MATCH_THRESHOLD:
            logger.warning(
                "Ambiguous similarity %.3f for arc %s — skipping",
                score, arc_id,
            )
            return RoutingResult(
                action="skipped",
                arc_id=arc_id,
                similarity_score=score,
            )

        # Condition A — Match (similarity > 0.85) → run gatekeeper
        gatekeeper_output = await self._run_gatekeeper(
            existing_timeline=payload.existing_timeline or [],
            article_text=payload.article_text,
        )

        if not gatekeeper_output.is_relevant:
            logger.info(
                "Gatekeeper rejected article for arc %s (redundant)", arc_id
            )
            return RoutingResult(
                action="irrelevant",
                arc_id=arc_id,
                similarity_score=score,
                gatekeeper_output=gatekeeper_output,
            )

        logger.info(
            "Gatekeeper approved article for arc %s: %s",
            arc_id,
            gatekeeper_output.new_timeline_event,
        )
        return RoutingResult(
            action="matched",
            arc_id=arc_id,
            similarity_score=score,
            gatekeeper_output=gatekeeper_output,
        )

    # ------------------------------------------------------------------
    # Embedding Operations
    # ------------------------------------------------------------------

    def upsert_embedding(self, arc_id: str, topic_summary: str) -> None:
        """Public method to upsert an arc's topic summary in ChromaDB.

        Called by the Node.js backend (via API) after creating a new
        arc document in MongoDB, or used internally during routing.

        Args:
            arc_id: Unique arc identifier (MongoDB _id).
            topic_summary: Concise topic summary to embed.
        """
        self._upsert_arc_embedding(arc_id, topic_summary)

    # ------------------------------------------------------------------
    # Private Helpers
    # ------------------------------------------------------------------

    def _find_matching_arc(self, article_text: str) -> tuple[str | None, float]:
        """Query ChromaDB for the most similar story arc.

        Args:
            article_text: Full text of the incoming article.

        Returns:
            Tuple of (arc_id, similarity_score). arc_id is None if the
            collection is empty.
        """
        try:
            if self.collection.count() == 0:
                logger.info("ChromaDB collection is empty — no arcs to match.")
                return None, 0.0

            results = self.collection.query(
                query_texts=[article_text],
                n_results=1,
                include=["distances"],
            )

            if not results["ids"] or not results["ids"][0]:
                return None, 0.0

            arc_id = results["ids"][0][0]
            # ChromaDB returns cosine *distance*; similarity = 1 - distance
            distance = results["distances"][0][0]
            similarity = 1.0 - distance

            logger.debug(
                "Best match: arc=%s, distance=%.4f, similarity=%.4f",
                arc_id, distance, similarity,
            )
            return arc_id, similarity

        except Exception:
            logger.exception("ChromaDB query failed")
            return None, 0.0

    def _upsert_arc_embedding(
        self, arc_id: str, topic_summary: str
    ) -> None:
        """Upsert a topic summary embedding into ChromaDB.

        Args:
            arc_id: Unique identifier for the story arc.
            topic_summary: The summary text to embed.
        """
        try:
            self.collection.upsert(
                ids=[arc_id],
                documents=[topic_summary],
                metadatas=[{"topic_summary": topic_summary}],
            )
            logger.info("Upserted embedding for arc %s", arc_id)
        except Exception:
            logger.exception("Failed to upsert embedding for arc %s", arc_id)
            raise

    async def _run_gatekeeper(
        self,
        existing_timeline: list,
        article_text: str,
    ) -> GatekeeperOutput:
        """Invoke the Gemini gatekeeper to evaluate article relevance.

        Args:
            existing_timeline: List of TimelineEvent dicts from MongoDB.
            article_text: Full text of the new article.

        Returns:
            Parsed GatekeeperOutput from the LLM.

        Raises:
            Exception: If the LLM call or parsing fails.
        """
        # Format timeline for prompt
        if existing_timeline:
            timeline_str = "\n".join(
                f"- [{e.event_date if hasattr(e, 'event_date') else e.get('event_date', 'N/A')}] "
                f"{e.event_text if hasattr(e, 'event_text') else e.get('event_text', '')}"
                for e in existing_timeline
            )
        else:
            timeline_str = "(No existing timeline — this is the first event.)"

        try:
            result = await self.gatekeeper_chain.ainvoke(
                {
                    "existing_timeline": timeline_str,
                    "article_text": article_text,
                    "format_instructions": self.gatekeeper_parser.get_format_instructions(),
                }
            )
            return result
        except Exception:
            logger.exception("Gatekeeper LLM call failed")
            raise

    async def _generate_topic_summary(self, article_text: str) -> str:
        """Generate a concise topic summary using Gemini.

        Args:
            article_text: Full article text.

        Returns:
            A single-sentence topic summary (max ~25 words).
        """
        try:
            response = await self.llm.ainvoke(
                TOPIC_SUMMARY_PROMPT.format(article_text=article_text)
            )
            raw = response.content
            if isinstance(raw, list):
                summary = "".join(
                    part.get("text", "") if isinstance(part, dict) else str(part)
                    for part in raw
                ).strip()
            else:
                summary = str(raw).strip()
            logger.info("Generated topic summary: %s", summary)
            return summary
        except Exception:
            logger.exception("Topic summary generation failed")
            raise

