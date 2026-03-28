"""Pydantic schemas for the Story Arc RAG pipeline.

Defines strict schemas for LLM output parsing, API request/response
contracts, and internal data structures.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# LLM Output Schema — used by PydanticOutputParser
# ---------------------------------------------------------------------------

class GatekeeperOutput(BaseModel):
    """Strict schema returned by the Gemini gatekeeper.

    The LangChain PydanticOutputParser enforces this shape, ensuring
    the LLM always returns valid, parseable JSON.
    """

    is_relevant: bool = Field(
        description=(
            "True if the new article provides a meaningful, "
            "non-redundant update to the existing story timeline."
        )
    )
    new_timeline_event: str | None = Field(
        default=None,
        description=(
            "A crisp, 1-sentence summary of the new timeline event. "
            "Only populated when is_relevant is True."
        ),
    )
    event_date: str | None = Field(
        default=None,
        description=(
            "ISO-8601 date (YYYY-MM-DD) of the event extracted from "
            "the article. Only populated when is_relevant is True."
        ),
    )


# ---------------------------------------------------------------------------
# API Request / Response Schemas
# ---------------------------------------------------------------------------

class TimelineEvent(BaseModel):
    """A single event within a compiled story timeline."""

    event_text: str
    event_date: str
    article_id: str


class RouteArticleRequest(BaseModel):
    """Payload sent by the Node.js server to the RAG service.

    Contains the article text, its ID, and (optionally) the existing
    timeline fetched from MongoDB so the gatekeeper can evaluate
    redundancy.
    """

    article_text: str = Field(
        description="Full text of the incoming article."
    )
    article_id: str = Field(
        description="Unique identifier of the article."
    )
    existing_timeline: list[TimelineEvent] | None = Field(
        default=None,
        description=(
            "The current compiled timeline for a matched story arc. "
            "Populated by Node.js when re-routing for gatekeeper evaluation."
        ),
    )


class RoutingResult(BaseModel):
    """Response returned to the Node.js server after routing."""

    action: str = Field(
        description=(
            "One of: 'matched' (appended to arc), 'created' (new arc), "
            "'skipped' (ambiguous similarity), 'irrelevant' (gatekeeper rejected)."
        )
    )
    arc_id: str | None = Field(
        default=None,
        description="The ChromaDB document ID of the matched or newly created arc.",
    )
    similarity_score: float | None = Field(
        default=None,
        description="Cosine similarity score from ChromaDB (0.0–1.0).",
    )
    gatekeeper_output: GatekeeperOutput | None = Field(
        default=None,
        description="Full gatekeeper response, if the gatekeeper was invoked.",
    )
    topic_summary: str | None = Field(
        default=None,
        description="Generated topic summary (only for newly created arcs).",
    )


class CreateArcEmbeddingRequest(BaseModel):
    """Request to store a new arc's topic summary in ChromaDB."""

    arc_id: str = Field(description="Unique arc identifier from MongoDB.")
    topic_summary: str = Field(description="Concise topic summary to embed.")


class SyncEmbeddingsRequest(BaseModel):
    """Request payload to sync StoryArc embeddings from MongoDB."""

    limit: int | None = Field(
        default=None,
        ge=1,
        description="Optional max number of MongoDB docs to process.",
    )
    batch_size: int = Field(
        default=100,
        ge=1,
        le=1000,
        description="Embedding/upsert batch size.",
    )
    dry_run: bool = Field(
        default=False,
        description="If true, validates and embeds without upserting to ChromaDB.",
    )


class SyncEmbeddingsResult(BaseModel):
    """Response payload for embedding sync operation."""

    status: str
    mongo_db: str
    mongo_collection: str
    embedding_model: str
    fetched_docs: int
    embedded_docs: int
    upserted_docs: int
    skipped_docs: int
    dry_run: bool


# ---------------------------------------------------------------------------
# Vibe Translate Schemas
# ---------------------------------------------------------------------------

class VibeTranslateRequest(BaseModel):
    """Payload for tone/language adaptation of a news article."""

    article_id: str = Field(description="Article identifier for caching.")
    title: str = Field(description="Original article title.")
    description: str = Field(description="Original article description.")
    tone: str = Field(default="neutral", description="Target tone (neutral, professional, genz, brief).")
    language: str = Field(default="English", description="Target language.")


class VibeTranslateResponse(BaseModel):
    """Response from the vibe translator."""

    title: str = Field(description="Adapted title.")
    description: str = Field(description="Adapted description.")
    tone: str = Field(description="Tone used.")
    language: str = Field(description="Language used.")


# ---------------------------------------------------------------------------
# Vibe Video Schemas
# ---------------------------------------------------------------------------

class VibeVideoRequest(BaseModel):
    """Payload for generating a "So Sorry" style animation prompt."""

    article_id: str
    title: str
    description: str
    summary: str = Field(default="", description="Full ET summary/body context for richer prompt generation.")


class VibeVideoResponse(BaseModel):
    """Response containing the generated video URL."""

    article_id: str
    video_url: str
    prompt_used: str

