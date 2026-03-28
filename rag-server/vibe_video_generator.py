import logging
import math
import os
import re
import time
from pathlib import Path
from google import genai
from google.genai import types
from schemas import VibeVideoRequest, VibeVideoResponse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt Templates
# ---------------------------------------------------------------------------

VIDEO_PROMPT_SYSTEM = """\
You are a senior cinematic prompt director for Veo 3.1 text-to-video.

Write ONE long, production-grade prompt for a portrait-first satire animation.

Rules:
1. Length must be 180 to 280 words.
2. Use fictional archetypes only. Never reference real people or likenesses.
3. Keep the tone playful and newsroom-satirical, with clean family-safe comedy.
4. Include visual structure: subject, setting, scene progression, camera plan,
   lens style, lighting, motion cues, transitions, and synchronized audio cues.
5. Keep continuity-friendly wording so the clip can be extended seamlessly.
6. Keep center-weighted composition so the output can be safely cropped for 9:16 mobile playback.

Return ONLY the final prompt text. No labels. No markdown.
"""

PROMPT_MODEL_FALLBACKS = ("gemini-2.5-flash", "gemini-2.0-flash")

DEFAULT_FALLBACK_VIDEO_URL = (
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
)


def _parse_positive_int(value: str | None, default: int) -> int:
    if not value:
        return default
    try:
        parsed = int(value)
        return parsed if parsed > 0 else default
    except ValueError:
        return default


NAME_LIKE_PATTERN = re.compile(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b")


def _anonymize_source_text(text: str) -> str:
    """Best-effort anonymization to reduce policy-filtered Veo outputs."""
    if not text:
        return ""
    return NAME_LIKE_PATTERN.sub("a fictional public figure", text)


def _sanitize_generated_prompt(prompt: str, source_text: str) -> str:
    """Remove real-name traces from the generated prompt before Veo call."""
    sanitized = (prompt or "").strip()
    if not sanitized:
        return sanitized

    # Replace entities seen in source content from the final prompt.
    for entity in sorted(set(NAME_LIKE_PATTERN.findall(source_text)), key=len, reverse=True):
        sanitized = re.sub(
            rf"\b{re.escape(entity)}\b",
            "a fictional public figure",
            sanitized,
            flags=re.IGNORECASE,
        )

    # Strip common likeness phrases that can trigger policy checks.
    sanitized = re.sub(
        r"\b(looks like|resembling|modeled after|in the style of)\b\s+"
        r"[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}",
        "styled as a fictional character",
        sanitized,
        flags=re.IGNORECASE,
    )

    return re.sub(r"\s{2,}", " ", sanitized).strip()


def _build_policy_safe_retry_prompt(title: str, summary_text: str) -> str:
    safe_title = _anonymize_source_text(title)
    safe_summary = _anonymize_source_text(summary_text)
    return (
        "A portrait 9:16, satirical 3D animation set in a modern newsroom. "
        "A fictional spokesperson and a fictional executive react with exaggerated comic timing "
        "to a breaking headline. Scene one opens with a kinetic medium shot, scene two pushes "
        "to an expressive close-up punchline, scene three lands on a dramatic wide finale with "
        "comic confetti and playful ambient newsroom sound design. "
        f"Context headline: {safe_title}. "
        f"Context details: {safe_summary}."
    )

def _build_extension_prompt(base_prompt: str, segment_idx: int, total_segments: int) -> str:
    return (
        f"{base_prompt} Continue seamlessly for segment {segment_idx} of {total_segments}. "
        "Preserve character identity, wardrobe, lighting, and camera language. "
        "Advance the satire with one clear beat and a smooth transition cue for the next segment."
    )


class VibeVideoGenerator:
    """Generates satire animations using Gemini prompting + Veo 3.1."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(api_key=self.api_key)
        self.output_dir = Path("static/videos")
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.prompt_model = os.getenv("VEO_PROMPT_MODEL", "gemini-2.5-pro")
        self.aspect_ratio = os.getenv("VEO_ASPECT_RATIO", "16:9")
        self.resolution = os.getenv("VEO_RESOLUTION", "720p")
        self.clip_duration_seconds = 8

        target_duration = _parse_positive_int(
            os.getenv("VEO_TARGET_DURATION_SECONDS"),
            16,
        )
        self.target_duration_seconds = min(max(target_duration, 15), 60)
        self.target_segments = max(
            2,
            min(7, math.ceil(self.target_duration_seconds / self.clip_duration_seconds)),
        )

        # Gemini API currently requires 16:9 input for video extension in this environment.
        if self.target_segments > 1 and self.aspect_ratio != "16:9":
            logger.warning(
                "Overriding VEO_ASPECT_RATIO=%s to 16:9 for extension compatibility",
                self.aspect_ratio,
            )
            self.aspect_ratio = "16:9"

        self.fallback_video_url = os.getenv(
            "VEO_FALLBACK_VIDEO_URL",
            DEFAULT_FALLBACK_VIDEO_URL,
        )
        logger.info(
            "VibeVideoGenerator initialised (model=veo-3.1-generate-preview, prompt_model=%s, aspect=%s, resolution=%s, target_duration=%ss, segments=%s)",
            self.prompt_model,
            self.aspect_ratio,
            self.resolution,
            self.target_duration_seconds,
            self.target_segments,
        )

    def _generate_prompt(self, req: VibeVideoRequest, summary_text: str) -> str:
        safe_title = _anonymize_source_text(req.title)
        safe_summary = _anonymize_source_text(summary_text)

        prompt_input = (
            "Use the complete ET article context below to build a high-detail cinematic prompt.\n\n"
            f"Headline: {safe_title}\n"
            f"Full ET Summary: {safe_summary}\n\n"
            "Output must be continuity-friendly for multi-segment Veo extension and optimized for portrait mobile viewing."
        )

        prompt_models = [self.prompt_model, *PROMPT_MODEL_FALLBACKS]
        seen_models = set()
        for model_name in prompt_models:
            if model_name in seen_models:
                continue
            seen_models.add(model_name)
            try:
                prompt_response = self.client.models.generate_content(
                    model=model_name,
                    config=types.GenerateContentConfig(
                        system_instruction=VIDEO_PROMPT_SYSTEM
                    ),
                    contents=prompt_input,
                )
                candidate = (prompt_response.text or "").strip()
                if candidate:
                    logger.info("Prompt generated with model=%s", model_name)
                    return _sanitize_generated_prompt(
                        candidate,
                        f"{req.title}\n{summary_text}",
                    )
            except Exception as exc:
                logger.warning("Prompt generation with model=%s failed: %s", model_name, exc)

        logger.warning("All prompt models failed; using deterministic fallback prompt")
        return _build_policy_safe_retry_prompt(req.title, summary_text)

    def _poll_operation(self, operation):
        while not operation.done:
            logger.info("Waiting for video generation to complete...")
            time.sleep(10)
            operation = self.client.operations.get(operation=operation)
        return operation

    @staticmethod
    def _extract_generation_result(operation):
        result = operation.result or operation.response
        generated_videos = result.generated_videos if result else None
        filtered_count = getattr(result, "rai_media_filtered_count", None)
        filtered_reasons = getattr(result, "rai_media_filtered_reasons", None)
        return generated_videos, filtered_count, filtered_reasons

    def _generate_veo_segment(self, prompt_text: str, input_video=None):
        if input_video is None:
            config = types.GenerateVideosConfig(
                number_of_videos=1,
                aspect_ratio=self.aspect_ratio,
                resolution=self.resolution,
                duration_seconds=self.clip_duration_seconds,
            )
            operation = self.client.models.generate_videos(
                model="veo-3.1-generate-preview",
                prompt=prompt_text,
                config=config,
            )
        else:
            # Gemini API extension works from previously generated Veo videos.
            config = types.GenerateVideosConfig(
                number_of_videos=1,
                resolution="720p",
                duration_seconds=8,
            )
            operation = self.client.models.generate_videos(
                model="veo-3.1-generate-preview",
                prompt=prompt_text,
                video=input_video,
                config=config,
            )

        operation = self._poll_operation(operation)
        if operation.error:
            raise Exception(f"Video generation operation failed: {operation.error}")
        return (*self._extract_generation_result(operation), operation)

    def generate_animation(self, req: VibeVideoRequest) -> VibeVideoResponse:
        """Generate a portrait-first mobile video between 15s and 60s."""
        logger.info("Generating video prompt for article %s", req.article_id)

        summary_text = (req.summary or "").strip() or req.description
        selected_prompt = self._generate_prompt(req, summary_text)
        logger.info("Prompt generated: %s...", selected_prompt[:120])

        try:
            attempt_prompts = [selected_prompt]
            last_filtered_count = None
            last_filtered_reasons = None
            first_segment_video = None

            for attempt_idx, attempt_prompt in enumerate(attempt_prompts, start=1):
                logger.info("VEO first-segment attempt %s", attempt_idx)
                (
                    generated_videos,
                    last_filtered_count,
                    last_filtered_reasons,
                    operation,
                ) = self._generate_veo_segment(attempt_prompt)

                if generated_videos:
                    selected_prompt = attempt_prompt
                    first_segment_video = generated_videos[0].video
                    break

                logger.warning(
                    "VEO returned no videos. filtered_count=%s reasons=%s metadata=%s",
                    last_filtered_count,
                    last_filtered_reasons,
                    operation.metadata,
                )

                if attempt_idx == 1 and last_filtered_count:
                    retry_prompt = _build_policy_safe_retry_prompt(req.title, summary_text)
                    if retry_prompt != attempt_prompt:
                        logger.warning("Retrying Veo with stricter policy-safe prompt")
                        attempt_prompts.append(retry_prompt)

            if not first_segment_video:
                return VibeVideoResponse(
                    article_id=req.article_id,
                    video_url=self.fallback_video_url,
                    prompt_used=(
                        f"{selected_prompt}\n"
                        f"[fallback: no video output; rai_filtered={last_filtered_count}; reasons={last_filtered_reasons}]"
                    ),
                )

            current_video = first_segment_video
            for segment_idx in range(2, self.target_segments + 1):
                extension_prompt = _build_extension_prompt(
                    selected_prompt,
                    segment_idx,
                    self.target_segments,
                )
                logger.info("VEO extension segment %s/%s", segment_idx, self.target_segments)
                generated_videos, filtered_count, filtered_reasons, _ = self._generate_veo_segment(
                    extension_prompt,
                    input_video=current_video,
                )

                if not generated_videos:
                    raise Exception(
                        "Video extension returned no output "
                        f"(segment={segment_idx}, rai_filtered={filtered_count}, reasons={filtered_reasons})"
                    )
                current_video = generated_videos[0].video

            filename = f"animation_{req.article_id}.mp4"
            filepath = self.output_dir / filename

            self.client.files.download(file=current_video)
            current_video.save(str(filepath))

            logger.info("Video saved to %s", filepath)
            return VibeVideoResponse(
                article_id=req.article_id,
                video_url=f"/static/videos/{filename}",
                prompt_used=(
                    f"{selected_prompt}\n"
                    f"[duration_target={self.target_duration_seconds}s, segments={self.target_segments}, mobile_aspect={self.aspect_ratio}]"
                ),
            )
        except Exception as exc:
            logger.exception("VEO 3.1 generation failed")
            return VibeVideoResponse(
                article_id=req.article_id,
                video_url=self.fallback_video_url,
                prompt_used=(
                    f"{selected_prompt}\n"
                    f"[fallback: generation error: {str(exc)}]"
                ),
            )
