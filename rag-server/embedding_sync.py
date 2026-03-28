"""MongoDB -> Gemini Embeddings -> ChromaDB sync utilities.

This module backfills or refreshes vector embeddings for StoryArc topic
summaries by:
1) reading story arcs from MongoDB,
2) generating embeddings with Gemini,
3) upserting vectors into ChromaDB (cloud or local).
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from urllib.parse import urlparse

import chromadb
from chromadb.config import Settings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pymongo import MongoClient

logger = logging.getLogger(__name__)


@dataclass
class SyncStats:
    """Execution statistics for a sync run."""

    fetched_docs: int = 0
    embedded_docs: int = 0
    skipped_docs: int = 0
    upserted_docs: int = 0


def _build_chroma_client():
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


def _resolve_mongo_database_name(mongo_uri: str, mongo_db: str | None) -> str:
    """Resolve database name from explicit config or URI path."""
    if mongo_db:
        return mongo_db

    parsed = urlparse(mongo_uri)
    db_name = parsed.path.lstrip("/")
    if db_name:
        return db_name

    raise ValueError(
        "MongoDB database name is missing. Set MONGO_DB_NAME or include DB in MONGODB_URI."
    )


class MongoStoryArcEmbeddingSync:
    """Synchronise StoryArc topic summaries from MongoDB into ChromaDB."""

    def __init__(self) -> None:
        self.mongo_uri = os.getenv("MONGODB_URI", "").strip()
        if not self.mongo_uri:
            raise ValueError("MONGODB_URI is required for embedding sync.")

        self.mongo_db_name = _resolve_mongo_database_name(
            self.mongo_uri,
            os.getenv("MONGO_DB_NAME", "").strip() or None,
        )
        self.mongo_collection_name = os.getenv("MONGO_STORY_ARC_COLLECTION", "story_arcs")

        self.embedding_model_name = os.getenv(
            "GEMINI_EMBEDDING_MODEL",
            "gemini-embedding-2-preview",
        )

        google_api_key = os.getenv("GOOGLE_API_KEY", "").strip()
        if not google_api_key:
            raise ValueError("GOOGLE_API_KEY is required for Gemini embeddings.")

        self.embedder = GoogleGenerativeAIEmbeddings(
            model=self.embedding_model_name,
            google_api_key=google_api_key,
        )

        self.chroma_client = _build_chroma_client()
        collection_name = os.getenv("CHROMA_COLLECTION", "story_arc_topics")
        self.collection = self.chroma_client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def sync_story_arcs(
        self,
        limit: int | None = None,
        batch_size: int = 100,
        dry_run: bool = False,
    ) -> dict:
        """Backfill or refresh StoryArc vectors in ChromaDB.

        Args:
            limit: Optional maximum number of docs to process.
            batch_size: Number of docs to embed/upsert per batch.
            dry_run: If True, reads and validates docs without writing to ChromaDB.

        Returns:
            Summary dict with sync statistics.
        """
        if batch_size < 1:
            raise ValueError("batch_size must be >= 1")

        stats = SyncStats()
        mongo_client: MongoClient | None = None

        try:
            mongo_client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=10000)
            db = mongo_client[self.mongo_db_name]
            collection = db[self.mongo_collection_name]

            query = {"topic_summary": {"$exists": True, "$ne": ""}}
            cursor = collection.find(query)
            if limit and limit > 0:
                cursor = cursor.limit(limit)

            batch_ids: list[str] = []
            batch_docs: list[str] = []
            batch_metas: list[dict] = []

            for doc in cursor:
                stats.fetched_docs += 1

                arc_id = str(doc.get("arc_id") or doc.get("_id"))
                topic_summary = str(doc.get("topic_summary") or "").strip()

                if not topic_summary:
                    stats.skipped_docs += 1
                    continue

                batch_ids.append(arc_id)
                batch_docs.append(topic_summary)
                batch_metas.append(
                    {
                        "source": "mongodb",
                        "mongo_id": str(doc.get("_id")),
                        "category": str(doc.get("category") or ""),
                    }
                )

                if len(batch_ids) >= batch_size:
                    self._flush_batch(
                        ids=batch_ids,
                        documents=batch_docs,
                        metadatas=batch_metas,
                        stats=stats,
                        dry_run=dry_run,
                    )
                    batch_ids, batch_docs, batch_metas = [], [], []

            if batch_ids:
                self._flush_batch(
                    ids=batch_ids,
                    documents=batch_docs,
                    metadatas=batch_metas,
                    stats=stats,
                    dry_run=dry_run,
                )

            logger.info(
                "Embedding sync completed fetched=%d embedded=%d upserted=%d skipped=%d dry_run=%s",
                stats.fetched_docs,
                stats.embedded_docs,
                stats.upserted_docs,
                stats.skipped_docs,
                dry_run,
            )

            return {
                "status": "ok",
                "mongo_db": self.mongo_db_name,
                "mongo_collection": self.mongo_collection_name,
                "embedding_model": self.embedding_model_name,
                "fetched_docs": stats.fetched_docs,
                "embedded_docs": stats.embedded_docs,
                "upserted_docs": stats.upserted_docs,
                "skipped_docs": stats.skipped_docs,
                "dry_run": dry_run,
            }

        finally:
            if mongo_client is not None:
                mongo_client.close()

    def _flush_batch(
        self,
        ids: list[str],
        documents: list[str],
        metadatas: list[dict],
        stats: SyncStats,
        dry_run: bool,
    ) -> None:
        """Embed and upsert a single batch to ChromaDB."""
        if not ids:
            return

        stats.embedded_docs += len(ids)

        if dry_run:
            return

        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
        )
        stats.upserted_docs += len(ids)

