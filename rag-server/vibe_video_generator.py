import logging
import os
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
You are an expert animator and caricature designer for "So Sorry" (Aaj Tak style).
Your task is to take a news article and describe a funny, slapstick 3D animation script.

Style rules:
1. Characters are exaggerated 3D caricatures of real-world politicians or CEOs.
2. The scene is high-energy, funny, and satirical.
3. Use physical comedy (e.g., someone slipping on a banana peel made of money).
4. THE VIDEO MUST BE BETWEEN 15 TO 60 SECONDS.
5. Provide a detailed VISUAL description for a text-to-video AI model (VEO).

Response format: Just the detailed visual prompt. NO commentary.
"""

class VibeVideoGenerator:
    """Generates funny "So Sorry" style animations using Gemini 3 Flash and VEO 3.1."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(api_key=self.api_key)
        self.output_dir = Path("static/videos")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info("VibeVideoGenerator initialised (model=veo-3.1-generate-preview)")

    async def generate_animation(self, req: VibeVideoRequest) -> VibeVideoResponse:
        """Execute the two-stage video generation pipeline."""
        
        # 1. Generate the funny prompt using Gemini 3 Flash
        # (Using the same genai client for simplicity)
        logger.info("Generating funny animation prompt for article %s", req.article_id)
        
        prompt_response = self.client.models.generate_content(
            model="gemini-2.0-flash", # Using the latest flash as fallback for prompt engineering
            config=types.GenerateContentConfig(
                system_instruction=VIDEO_PROMPT_SYSTEM
            ),
            contents=f"Headline: {req.title}\nDescription: {req.description}"
        )
        
        video_prompt = prompt_response.text.strip()
        logger.info("Prompt generated: %s...", video_prompt[:100])

        # 2. Generate the video using VEO 3.1
        # The user requested synchronous (blocking) to avoid "background process costs"
        logger.info("Starting VEO 3.1 video generation (veo-3.1-generate-preview)")
        
        try:
            operation = self.client.models.generate_videos(
                model="veo-3.1-generate-preview",
                prompt=video_prompt,
            )

            # Poll until completion (Synchronous as requested)
            while not operation.done:
                logger.info("Waiting for video generation to complete...")
                time.sleep(10)
                operation = self.client.operations.get(operation)

            # 3. Save the result locally
            filename = f"animation_{req.article_id}.mp4"
            filepath = self.output_dir / filename
            
            generated_video = operation.response.generated_videos[0]
            # Download to the static folder
            self.client.files.download(file=generated_video.video)
            generated_video.video.save(str(filepath))
            
            # The URL will be relative to the RAG server's root + /static
            video_url = f"/static/videos/{filename}"
            
            logger.info("Video saved to %s", filepath)
            
            return VibeVideoResponse(
                article_id=req.article_id,
                video_url=video_url,
                prompt_used=video_prompt
            )

        except Exception as exc:
            logger.exception("VEO 3.1 generation failed")
            # For hackathon purposes, return a placeholder or error URL
            raise exc
