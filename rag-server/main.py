"""FastAPI application for the Story Arc RAG pipeline.

This service handles ONLY AI/RAG operations:
  - Semantic routing via ChromaDB Cloud
  - Gatekeeper evaluation via Gemini 3 Flash Preview
  - Topic summary embedding management

All MongoDB persistence is handled by the Node.js backend, which calls
these endpoints as an internal service.
"""

from __future__ import annotations

import logging
import os
from asyncio import to_thread
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from embedding_sync import MongoStoryArcEmbeddingSync
from news_bootstrapper import NewsBootstrapper
from schemas import (
    CreateArcEmbeddingRequest,
    RouteArticleRequest,
    RoutingResult,
    SyncEmbeddingsRequest,
    SyncEmbeddingsResult,
    VibeTranslateRequest,
    VibeTranslateResponse,
    VibeVideoRequest,
    VibeVideoResponse,
)
from story_arc_router import StoryArcRouter
from vibe_translator import VibeTranslator
from vibe_video_generator import VibeVideoGenerator
from fastapi.staticfiles import StaticFiles

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Application Lifespan
# ---------------------------------------------------------------------------
router_instance: StoryArcRouter | None = None
vibe_translator_instance: VibeTranslator | None = None
vibe_video_generator_instance: VibeVideoGenerator | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise shared resources on startup, clean up on shutdown."""
    global router_instance, vibe_translator_instance, vibe_video_generator_instance
    logger.info("Starting RAG server — initialising services...")

    try:
        router_instance = StoryArcRouter()
        logger.info("StoryArcRouter initialised successfully.")
    except Exception:
        logger.exception("Failed to initialise StoryArcRouter")
        raise

    try:
        vibe_translator_instance = VibeTranslator()
        logger.info("VibeTranslator initialised successfully.")
    except Exception:
        logger.exception("Failed to initialise VibeTranslator")
        raise

    try:
        vibe_video_generator_instance = VibeVideoGenerator()
        logger.info("VibeVideoGenerator initialised successfully.")
    except Exception:
        logger.warning("Failed to initialise VibeVideoGenerator (VEO 3.1 features will be unavailable)")

    # Auto-seed ChromaDB if empty
    try:
        doc_count = router_instance.collection.count()
        if doc_count == 0:
            logger.info("ChromaDB is empty — triggering bootstrap seed...")
            bootstrapper = NewsBootstrapper()
            stats = await to_thread(
                bootstrapper.seed, limit=50, batch_size=10
            )
            logger.info("Bootstrap complete: %s", stats)
        else:
            logger.info("ChromaDB has %d docs — skipping bootstrap.", doc_count)
    except Exception:
        logger.exception("Bootstrap seed failed (non-fatal, server will continue)")

    yield

    logger.info("Shutting down RAG server.")
    router_instance = None
    vibe_translator_instance = None
    vibe_video_generator_instance = None


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Newsie RAG Pipeline",
    description=(
        "Internal AI service for story arc routing. "
        "Called by the Node.js backend — not exposed to end users."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGIN", "http://localhost:8000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated videos locally
os.makedirs("static/videos", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["system"])
async def health_check():
    """Basic health check."""
    return {
        "status": "healthy",
        "service": "rag-server",
        "router_ready": router_instance is not None,
    }


@app.post(
    "/rag/route-article",
    response_model=RoutingResult,
    tags=["story-arcs"],
    summary="Route an article to a story arc",
)
async def route_article(payload: RouteArticleRequest) -> RoutingResult:
    """Receive an article from the Node.js backend and determine routing.

    The response tells the Node.js server what action to take:
    - **matched**: Append the gatekeeper-approved event to the existing arc.
    - **created**: Create a new arc document in MongoDB with the returned
      topic_summary, then call `/rag/create-arc-embedding`.
    - **skipped**: Ambiguous similarity — no action needed.
    - **irrelevant**: Gatekeeper rejected — article is redundant.
    """
    if router_instance is None:
        raise HTTPException(
            status_code=503,
            detail="StoryArcRouter not initialised.",
        )

    try:
        result = await router_instance.process_new_article(payload)
        return result
    except Exception as exc:
        logger.exception("Error processing article %s", payload.article_id)
        raise HTTPException(
            status_code=500,
            detail=f"RAG pipeline error: {str(exc)}",
        ) from exc


@app.post(
    "/rag/create-arc-embedding",
    tags=["story-arcs"],
    summary="Upsert a story arc topic embedding in ChromaDB",
)
async def create_arc_embedding(payload: CreateArcEmbeddingRequest):
    """Store or update a story arc's topic summary embedding.

    Called by the Node.js backend after creating a new StoryArc document
    in MongoDB. This ensures ChromaDB and MongoDB stay in sync.
    """
    if router_instance is None:
        raise HTTPException(
            status_code=503,
            detail="StoryArcRouter not initialised.",
        )

    try:
        router_instance.upsert_embedding(
            arc_id=payload.arc_id,
            topic_summary=payload.topic_summary,
        )
        return {"status": "ok", "arc_id": payload.arc_id}
    except Exception as exc:
        logger.exception("Failed to upsert embedding for arc %s", payload.arc_id)
        raise HTTPException(
            status_code=500,
            detail=f"Embedding upsert failed: {str(exc)}",
        ) from exc


@app.post(
    "/rag/sync-embeddings-from-mongodb",
    response_model=SyncEmbeddingsResult,
    tags=["story-arcs"],
    summary="Backfill StoryArc embeddings from MongoDB into ChromaDB",
)
async def sync_embeddings_from_mongodb(
    payload: SyncEmbeddingsRequest,
) -> SyncEmbeddingsResult:
    """Fetch StoryArc topic summaries from MongoDB and store vectors in ChromaDB.

    Uses Gemini embedding model (configured by GEMINI_EMBEDDING_MODEL) to
    generate vectors, then upserts them into the configured Chroma collection.
    """
    try:
        syncer = MongoStoryArcEmbeddingSync()
        result = await to_thread(
            syncer.sync_story_arcs,
            payload.limit,
            payload.batch_size,
            payload.dry_run,
        )
        return SyncEmbeddingsResult(**result)
    except Exception as exc:
        logger.exception("Embedding sync from MongoDB failed")
        raise HTTPException(
            status_code=500,
            detail=f"Embedding sync failed: {str(exc)}",
        ) from exc


@app.post(
    "/rag/vibe-translate",
    response_model=VibeTranslateResponse,
    tags=["personalisation"],
    summary="Translate article title/description to a target tone and language",
)
async def vibe_translate(payload: VibeTranslateRequest) -> VibeTranslateResponse:
    """Rewrite an article's title and description using the requested
    tone and language via Gemini 2.5 Flash Lite.

    Called by the Node.js backend to personalise feed content.
    """
    if vibe_translator_instance is None:
        raise HTTPException(
            status_code=503,
            detail="VibeTranslator not initialised.",
        )

    try:
        return await vibe_translator_instance.translate(payload)
    except Exception as exc:
        logger.exception(
            "Vibe translation failed for article %s", payload.article_id
        )
        raise HTTPException(
            status_code=500,
            detail=f"Vibe translation error: {str(exc)}",
        ) from exc


@app.post(
    "/rag/vibe-video",
    response_model=VibeVideoResponse,
    tags=["visuals"],
    summary="Generate a funny 'So Sorry' style animation for an article",
)
async def generate_vibe_video(req: VibeVideoRequest) -> VibeVideoResponse:
    """Trigger the Gemini 3 Flash + VEO 3.1 video generation pipeline."""
    if vibe_video_generator_instance is None:
        raise HTTPException(
            status_code=503,
            detail="VibeVideoGenerator not initialised.",
        )

    try:
        # Use to_thread because the genai polling logic is synchronous
        result = await to_thread(vibe_video_generator_instance.generate_animation, req)
        return result
    except Exception as exc:
        logger.exception("VibeVideoGenerator error for article %s", req.article_id)
        raise HTTPException(
            status_code=500,
            detail=f"Video generation error: {str(exc)}",
        )


@app.post(
    "/rag/bootstrap-news",
    tags=["system"],
    summary="Seed ChromaDB with news articles from MongoDB",
)
async def bootstrap_news(
    limit: int = 100,
    force: bool = False,
):
    """Read news articles from MongoDB, generate topic summaries via
    Gemini, and upsert them into ChromaDB.

    Only processes articles not already present in ChromaDB (unless
    force=True).
    """
    try:
        bootstrapper = NewsBootstrapper()
        stats = await to_thread(
            bootstrapper.seed,
            limit=limit,
            batch_size=10,
            force=force,
        )
        return {"status": "ok", **stats}
    except Exception as exc:
        logger.exception("Bootstrap failed")
        raise HTTPException(
            status_code=500,
            detail=f"Bootstrap failed: {str(exc)}",
        ) from exc


# ---------------------------------------------------------------------------
# Dev Server Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("RAG_SERVER_PORT", "8100")),
        reload=True,
    )
