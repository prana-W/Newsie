"""Bootstrap — seeds ChromaDB with news articles from MongoDB.

On startup (or on-demand), reads news articles from MongoDB and generates
topic summary embeddings for any that don't already exist in ChromaDB.
This ensures the semantic routing pipeline always has data to work with.
"""

from __future__ import annotations

import logging
import os
from typing import Optional
from urllib.parse import urlparse

import chromadb
from chromadb.config import Settings
from langchain_google_genai import ChatGoogleGenerativeAI
from pymongo import MongoClient

logger = logging.getLogger(__name__)


def _build_chroma_client():
    """Create ChromaDB client from environment."""
    mode = os.getenv("CHROMA_MODE", "cloud").strip().lower()
    if mode == "local":
        persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./.chroma")
        return chromadb.PersistentClient(path=persist_dir)

    raw_host = os.getenv("CHROMA_HOST", "localhost").strip()
    parsed = urlparse(raw_host if "://" in raw_host else f"https://{raw_host}")
    host = parsed.hostname or raw_host.replace("https://", "").replace("http://", "")
    ssl_env = os.getenv("CHROMA_SSL")
    use_ssl = (
        ssl_env.strip().lower() in {"1", "true", "yes", "on"}
        if ssl_env is not None
        else parsed.scheme == "https"
    )
    default_port = 443 if use_ssl else 8000
    port = int(os.getenv("CHROMA_PORT", str(parsed.port or default_port)))
    api_key = os.getenv("CHROMA_API_KEY", "").strip()

    kwargs = {
        "host": host,
        "port": port,
        "ssl": use_ssl,
        "tenant": os.getenv("CHROMA_TENANT", "default_tenant"),
        "database": os.getenv("CHROMA_DATABASE", "default_database"),
    }
    if api_key:
        kwargs["settings"] = Settings(
            chroma_client_auth_provider="chromadb.auth.token_authn.TokenAuthClientProvider",
            chroma_client_auth_credentials=api_key,
        )
    return chromadb.HttpClient(**kwargs)


def _extract_content(response) -> str:
    """Safely extract text from an LLM response (handles str or list)."""
    raw = response.content
    if isinstance(raw, list):
        return "".join(
            part.get("text", "") if isinstance(part, dict) else str(part)
            for part in raw
        ).strip()
    return str(raw).strip()


TOPIC_PROMPT = """\
You are a news editor. Read the following article and produce a single,
concise topic summary sentence (max 25 words) that captures the core
subject of the story. This summary will be used to match future related
articles.

Article:
{article_text}

Respond with ONLY the topic summary sentence, nothing else.
"""


class NewsBootstrapper:
    """Seeds ChromaDB with topic embeddings for news articles from MongoDB.

    Reads articles from the MongoDB news collection, generates a topic
    summary for each via Gemini, and upserts the summary into ChromaDB.
    Only processes articles whose _id is NOT already in ChromaDB.
    """

    def __init__(self) -> None:
        mongo_uri = os.getenv("MONGODB_URI", "").strip()
        if not mongo_uri:
            raise ValueError("MONGODB_URI is required for bootstrapping.")

        self.mongo_uri = mongo_uri
        self.mongo_db = os.getenv("MONGO_DB_NAME", "ET-DATA")
        self.mongo_collection = os.getenv("MONGO_NEWS_COLLECTION", "ET-news")

        self.chroma_client = _build_chroma_client()
        collection_name = os.getenv("CHROMA_COLLECTION", "story_arc_topics")
        self.collection = self.chroma_client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

        self.llm = ChatGoogleGenerativeAI(
            model=os.getenv("BOOTSTRAP_MODEL", "gemini-2.5-flash-lite"),
            temperature=0.1,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )

    def _get_existing_ids(self) -> set[str]:
        """Return the set of all document IDs already in ChromaDB."""
        count = self.collection.count()
        if count == 0:
            return set()
        # Fetch all IDs
        result = self.collection.get(include=[])
        return set(result["ids"]) if result and result["ids"] else set()

    def _generate_summary(self, text: str) -> str:
        """Generate a topic summary for an article via Gemini."""
        response = self.llm.invoke(TOPIC_PROMPT.format(article_text=text[:3000]))
        return _extract_content(response)

    def seed(
        self,
        limit: int = 100,
        batch_size: int = 10,
        force: bool = False,
    ) -> dict:
        """Seed ChromaDB with news articles not already embedded.

        Args:
            limit: Max articles to process.
            batch_size: Articles to process before upserting.
            force: If True, re-embeds even if already present.

        Returns:
            Dict with statistics.
        """
        existing_ids = set() if force else self._get_existing_ids()
        logger.info(
            "Bootstrap: ChromaDB has %d existing embeddings. force=%s",
            len(existing_ids),
            force,
        )

        mongo_client: Optional[MongoClient] = None
        stats = {
            "fetched": 0,
            "already_present": 0,
            "embedded": 0,
            "failed": 0,
        }

        try:
            mongo_client = MongoClient(
                self.mongo_uri, serverSelectionTimeoutMS=10000
            )
            db = mongo_client[self.mongo_db]
            coll = db[self.mongo_collection]

            cursor = (
                coll.find({}, {"_id": 1, "title": 1, "description": 1, "section": 1})
                .sort([("_id", -1)])
                .limit(limit)
            )

            batch_ids: list[str] = []
            batch_docs: list[str] = []
            batch_metas: list[dict] = []

            for doc in cursor:
                stats["fetched"] += 1
                article_id = str(doc["_id"])

                if article_id in existing_ids:
                    stats["already_present"] += 1
                    continue

                title = doc.get("title", "")
                description = doc.get("description", "")
                text = f"{title}\n\n{description}".strip()
                if not text:
                    stats["failed"] += 1
                    continue

                try:
                    summary = self._generate_summary(text)
                    if not summary:
                        stats["failed"] += 1
                        continue

                    batch_ids.append(article_id)
                    batch_docs.append(summary)
                    batch_metas.append({
                        "topic_summary": summary,
                        "category": doc.get("section", ""),
                        "source": "news_bootstrap",
                    })
                    stats["embedded"] += 1

                    if len(batch_ids) >= batch_size:
                        self.collection.upsert(
                            ids=batch_ids,
                            documents=batch_docs,
                            metadatas=batch_metas,
                        )
                        logger.info("Upserted batch of %d embeddings", len(batch_ids))
                        batch_ids, batch_docs, batch_metas = [], [], []

                except Exception:
                    logger.exception("Failed to embed article %s", article_id)
                    stats["failed"] += 1

            # Flush remaining batch
            if batch_ids:
                self.collection.upsert(
                    ids=batch_ids,
                    documents=batch_docs,
                    metadatas=batch_metas,
                )
                logger.info("Upserted final batch of %d embeddings", len(batch_ids))

        finally:
            if mongo_client is not None:
                mongo_client.close()

        logger.info(
            "Bootstrap complete: fetched=%d already_present=%d embedded=%d failed=%d",
            stats["fetched"],
            stats["already_present"],
            stats["embedded"],
            stats["failed"],
        )
        return stats
