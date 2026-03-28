import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()
from vibe_translator import VibeTranslator
from schemas import VibeTranslateRequest

async def main():
    try:
        vt = VibeTranslator()
        req = VibeTranslateRequest(
            article_id="123",
            title="India claims World Cup",
            description="India beat Australia in the final match of the ICC World Cup.",
            tone="neutral",
            language="Telugu"
        )
        res = await vt.translate(req)
        with open("out.txt", "w", encoding="utf-8") as f:
            f.write(res.title + '\n')
            f.write(res.description + '\n')
    except Exception as e:
        with open("out.txt", "w", encoding="utf-8") as f:
            f.write(f"ERROR: {e}")

asyncio.run(main())
