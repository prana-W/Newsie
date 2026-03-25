import logging
import hashlib
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image

logger = logging.getLogger(__name__)

def generate_and_cache_image(visual_direction: str, gen_images_dir: Path) -> str:
    """Generate an image using Google GenAI or return a cached version."""
    if not visual_direction:
        visual_direction = "A cool, aesthetic abstract background for a news app, gen-z style"
        
    try:
        prompt_hash = hashlib.md5(visual_direction.encode('utf-8')).hexdigest()
        image_filename = f"{prompt_hash}.png"
        image_filepath = gen_images_dir / image_filename
        
        # Check if we already have the image cached
        if image_filepath.exists():
            logger.info(f"Using cached image: {image_filename}")
            return f"/static/generated_images/{image_filename}"
            
        logger.info(f"Generating new image for prompt hash: {prompt_hash}")
        client = genai.Client()
        img_response = client.models.generate_images(
            model='imagen-4.0-generate-001',
            prompt=visual_direction,
            config=types.GenerateImagesConfig(
                number_of_images= 1,
            )
        )
        
        image_url = "https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=800&q=80"
        if img_response.generated_images:
            generated_image = img_response.generated_images[0]
            # Save image directly to server storage
            generated_image.image.save(str(image_filepath))
            image_url = f"/static/generated_images/{image_filename}"
            
        return image_url
    except Exception as img_err:
        logger.error(f"Image generation/caching failed: {img_err}")
        return "https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=800&q=80"
