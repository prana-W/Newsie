"""Vibe Translator — Tone & language adaptation using Gemini 2.5 Flash Lite.

Rewrites news article titles and descriptions into a requested tone and
language.  Called by the Node.js backend via ``POST /rag/vibe-translate``.

Results are cached in-memory (per-process) to avoid repeated LLM calls
for the same (article_id, tone, language) combination.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Dict, Tuple

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from schemas import VibeTranslateRequest, VibeTranslateResponse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------
VIBE_TRANSLATE_SYSTEM = """\
You are a multilingual financial news rewriter.
Rewrite the given news **title** and **description** using the requested
tone and language.  Preserve all factual content — do NOT invent data.

Respond with **only** valid JSON (no markdown fences):
{{"title": "…", "description": "…"}}
"""

VIBE_TRANSLATE_USER = """\
Requested tone: {tone}
Requested language: {language}

Title:
{title}

Description:
{description}
"""


class VibeTranslator:
    """Adapts news content to a user's preferred vibe and language."""

    def __init__(self) -> None:
        self.llm = ChatGoogleGenerativeAI(
            model=os.getenv("VIBE_MODEL", "gemini-2.5-flash-lite"),
            temperature=0.3,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )
        self.prompt = ChatPromptTemplate.from_messages(
            [
                ("system", VIBE_TRANSLATE_SYSTEM),
                ("human", VIBE_TRANSLATE_USER),
            ]
        )
        self.chain = self.prompt | self.llm
        # In-memory cache:  (article_id, tone, language) → response
        self._cache: Dict[Tuple[str, str, str], VibeTranslateResponse] = {}
        logger.info("VibeTranslator initialised (model=%s)", self.llm.model)

    async def translate(
        self, req: VibeTranslateRequest
    ) -> VibeTranslateResponse:
        """Translate an article's title + description.

        Returns a cached result when available, otherwise calls Gemini.
        """
        tone = (req.tone or "neutral").strip().lower()
        language = (req.language or "English").strip()
        cache_key = (req.article_id, tone, language)

        # Fast-path: skip LLM when no transformation is needed
        if tone == "neutral" and language.lower() == "english":
            return VibeTranslateResponse(
                title=req.title,
                description=req.description,
                tone=tone,
                language=language,
            )

        if cache_key in self._cache:
            logger.debug("Cache hit for %s", cache_key)
            return self._cache[cache_key]

        try:
            result = await self.chain.ainvoke(
                {
                    "tone": tone,
                    "language": language,
                    "title": req.title,
                    "description": req.description,
                }
            )

            raw = result.content
            if isinstance(raw, list):
                raw = "".join(
                    part.get("text", "") if isinstance(part, dict) else str(part)
                    for part in raw
                )
            raw = str(raw).strip()
            # Strip optional markdown fences
            raw = raw.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(raw)

            response = VibeTranslateResponse(
                title=parsed.get("title", req.title),
                description=parsed.get("description", req.description),
                tone=tone,
                language=language,
            )
            self._cache[cache_key] = response
            logger.info(
                "Translated article %s → tone=%s lang=%s",
                req.article_id,
                tone,
                language,
            )
            return response

        except Exception:
            logger.exception(
                "VibeTranslator failed for article %s", req.article_id
            )
            # Graceful fallback — return originals
            return VibeTranslateResponse(
                title=req.title,
                description=req.description,
                tone=tone,
                language=language,
            )
