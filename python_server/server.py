"""
Fin-Z News Feed — FastAPI Server
Serves the Gen-Z news feed UI and connects to the FinZEditor pipeline.
"""

import os
import json
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from genz_editor import FinZEditor
from image_service import generate_and_cache_image
from voice_chat import handle_voice_session, set_feed_cards

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Fin-Z News Feed", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files ─────────────────────────────────────────────────────────────
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(exist_ok=True)
GEN_IMAGES_DIR = STATIC_DIR / "generated_images"
GEN_IMAGES_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# ── Request schema ───────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    article: str

# ── Pre-built sample cards ───────────────────────────────────────────────────
SAMPLE_CARDS = [
    {
        "hook": "The Iran situation just went full main-character-energy — and your portfolio is a side character getting COOKED. 🔥",
        "TLDR": "Okay bestie, buckle up. Iran, Israel, and the US are in a full-blown conflict and it's NOT giving peace. Iran launched missiles that literally hit Tel Aviv, Israel clapped back hard, and the US is deploying troops like it's a Call of Duty lobby. Oil prices? Through the roof. Your grocery bill? Also through the roof. The Strait of Hormuz — aka the shipping route that controls like 20% of the world's oil — is basically a no-go zone rn. India's manufacturing is tanking, the S&P is having mood swings, and diplomacy is ghosting everyone. This is giving WW3 energy and the global economy is NOT vibing.",
        "financial_facts": [
            "Iran launched missiles hitting central Tel Aviv, injuring multiple civilians",
            "Iran retains strike capability despite losing a large portion of its missile launch infrastructure",
            "Thousands killed in Iran from US-Israeli strikes; thousands injured in Israel from Iranian attacks",
            "Iranian strikes reached Saudi Arabia, Bahrain, and the UAE",
            "Oil prices surged due to Strait of Hormuz disruption",
            "India's manufacturing activity fell to a multi-year low",
            "US facing rising energy costs, contributing to inflation and job cuts"
        ],
        "vibe_check": "Cooked 💀",
        "visual_direction": "Open on a calm globe spinning slowly, then zoom into the Middle East as red shockwave rings pulse outward from Iran and Israel. Cut to an animated oil barrel with a rocket strapped to it launching into space, then a stock ticker melting like a Salvador Dalí painting. End with a Gen-Z character doomscrolling on their phone while their portfolio chart nosedives behind them.",
        "image": "/static/images/iran.png",
        "category": "World",
        "source": "Reuters / The Guardian"
    },
    {
        "hook": "NVIDIA just dropped earnings that made Wall Street collectively lose its mind — your GPU stocks are printing money rn 💰",
        "TLDR": "NVIDIA said 'hold my graphics card' and absolutely BODIED earnings expectations. Revenue hit $35.1 billion — yeah, BILLION with a B — beating estimates by like 20%. Data center revenue specifically went absolutely feral at $30.8B, up 93% YoY. Jensen Huang basically said AI demand is 'insatiable' which is lowkey the most bullish thing a CEO has ever said. The stock popped 8% after hours and every tech bro on Twitter is crying tears of joy. If you bought NVDA dips, congrats — you have elite financial rizz.",
        "financial_facts": [
            "NVIDIA Q4 FY2026 revenue: $35.1 billion, beating estimates of $29.4 billion",
            "Data center revenue: $30.8 billion, up 93% year-over-year",
            "Gross margin: 73.5%",
            "Stock rose 8% in after-hours trading",
            "Full-year revenue guidance raised to $140 billion for FY2027",
            "Blackwell architecture GPU shipments began in Q4"
        ],
        "vibe_check": "Stonks 📈",
        "visual_direction": "A neon-lit server room pulses with energy as GPU chips multiply like cells under a microscope. Jensen Huang appears as a hologram giving a chef's kiss, then the camera pulls back to reveal a massive green stock chart shaped like a rocket launching through the roof of Wall Street. Confetti made of dollar bills rains down.",
        "image": "/static/images/nvidia.png",
        "category": "Tech",
        "source": "NVIDIA / Bloomberg"
    },
    {
        "hook": "Gen Z is officially the BROKE generation — but plot twist, they're also the most financially literate? Make it make sense 😭",
        "TLDR": "New data just dropped and it's giving mixed signals fr fr. A study from the National Financial Educators Council says Gen Z loses an average of $1,702 per year due to financial illiteracy BUT simultaneously, 67% of Gen Z-ers are actively investing before age 25 — that's way more than millennials or boomers at the same age. They're learning from TikTok and YouTube instead of school, which is honestly iconic but also slightly terrifying. The average Gen Z savings account has $2,100 but their student debt averages $37,000. Math ain't mathing but the hustle is real.",
        "financial_facts": [
            "Gen Z loses an average of $1,702/year due to financial illiteracy (NFEC study)",
            "67% of Gen Z actively investing before age 25",
            "Average Gen Z savings: $2,100",
            "Average Gen Z student debt: $37,000",
            "42% of Gen Z learned investing from social media platforms",
            "Gen Z accounts for 25% of all new brokerage accounts opened in 2025"
        ],
        "vibe_check": "Major Vibe ✨",
        "visual_direction": "Split screen: left side shows a stressed college student surrounded by floating bills and loan statements, right side shows the same person confidently trading on their phone with green charts everywhere. The two sides merge as the student literally walks from the chaos into the glow-up side, picking up money bags along the way.",
        "image": "/static/images/genz.png",
        "category": "Markets",
        "source": "NFEC / Economic Times"
    },
    {
        "hook": "Bitcoin just flipped the script AGAIN — $100K was not the ceiling, it was the floor 🚀",
        "TLDR": "Bitcoin said 'I don't know what a bear market is' and absolutely SENT it past $112,000 this week. The catalyst? BlackRock's Bitcoin ETF just became the fastest ETF in history to reach $50 billion in assets — took only 11 months. Meanwhile, MicroStrategy bought another 15,000 BTC because Michael Saylor literally cannot stop won't stop. El Salvador's Bitcoin holdings are now worth $600M+ in profit and their president is posting W's on X daily. Even the Fed is lowkey pivoting dovish which is bullish for risk assets. If you're not holding at least some crypto rn, you're basically sleeping through the financial revolution bestie.",
        "financial_facts": [
            "Bitcoin surpassed $112,000 this week",
            "BlackRock Bitcoin ETF (IBIT) reached $50 billion AUM in 11 months",
            "MicroStrategy purchased additional 15,000 BTC",
            "El Salvador's BTC holdings now showing $600M+ unrealized profit",
            "Total crypto market cap exceeds $4.2 trillion",
            "Federal Reserve signaled potential rate cuts in Q2 2026"
        ],
        "vibe_check": "Stonks 📈",
        "visual_direction": "A golden Bitcoin coin spins in space, growing larger and larger until it eclipses the moon. Cut to Michael Saylor surfing on a wave made of Bitcoin logos. Then zoom into a phone screen showing the price chart going vertical while notification sounds play like a symphony. End with laser eyes appearing on the Statue of Liberty.",
        "image": "/static/images/bitcoin.png",
        "category": "Markets",
        "source": "BlackRock / CoinDesk"
    }
]

# ── Inject feed context for voice chat ───────────────────────────────────────
set_feed_cards(SAMPLE_CARDS)

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
async def serve_index():
    return FileResponse(str(STATIC_DIR / "index.html"))


@app.get("/api/samples")
async def get_samples():
    """Return pre-built sample Gen-Z news cards."""
    # Process dynamically generated images for samples
    processed_samples = []
    for card in SAMPLE_CARDS:
        card_copy = card.copy()
        if "visual_direction" in card_copy:
            card_copy["image"] = generate_and_cache_image(card_copy["visual_direction"], GEN_IMAGES_DIR)
        processed_samples.append(card_copy)
    return processed_samples


@app.post("/api/generate")
async def generate_card(req: GenerateRequest):
    """Transform raw news text into a Gen-Z news card via Gemini."""
    if not req.article.strip():
        raise HTTPException(status_code=400, detail="Article text cannot be empty.")

    try:
        editor = FinZEditor()
        card = editor.generate_news_card(req.article)
        result = card.model_dump()
        
        # Image generation and caching logic
        result["image"] = generate_and_cache_image(result.get("visual_direction", ""), GEN_IMAGES_DIR)

        # Add metadata for generated cards
        result["category"] = "Breaking"
        result["source"] = "Fin-Z AI"
        return result
    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


# ── Voice Chat WebSocket ─────────────────────────────────────────────────────
@app.websocket("/ws/voice")
async def voice_ws(websocket: WebSocket):
    await handle_voice_session(websocket)


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
