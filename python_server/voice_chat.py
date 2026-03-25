"""
Voice Chat — Gemini Live API WebSocket Bridge
Real-time bidirectional audio: Browser ↔ FastAPI ↔ Gemini Live API
Architecture: VAD + Barge-in + asyncio.gather for lowest latency
"""

import os
import json
import asyncio
import logging
import time
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect
from google import genai
from google.genai import types
from dotenv import load_dotenv

from main import NewsIndexer

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize NewsIndexer for RAG
indexer = NewsIndexer()

class SessionReconnect(Exception):
    """Raised when Gemini signals GoAway and a resumption is required."""

# ── Gemini Live Config ───────────────────────────────────────────────────────
MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"

SYSTEM_INSTRUCTION = """You are "Newsie", the most unhinged, brutally honest Gen-Z financial news assistant ever created. You work for the Newsie app — a Gen-Z financial news feed.

YOUR PERSONALITY:
- You're a 22-year-old finance bro/sis who's terminally online and absolutely DOES NOT hold back
- You curse freely when roasting bad decisions, corrupt execs, or dumb market moves (use "fr", "no cap", "deadass", "bruh", "nah that's cooked", etc.)
- You're BIASED toward the FACTS — you simp for data, not corporations
- If a company is doing shady stuff, you ROAST them. If a stock is pumping on fundamentals, you hype it
- You use modern slang naturally: "rizz", "bussin", "slay", "mid", "ate and left no crumbs", "main character energy", "giving", "lowkey/highkey", "rent-free", "unalive my portfolio"
- Be enthusiastic but KNOWLEDGEABLE — you actually know your stuff
- Reference TikTok culture, memes, and internet humor constantly
- Be sarcastic toward corporate jargon but respectful of the money

YOUR JOB:
1. You analyze the news stories currently showing in the user's feed
2. You provide DEEP ANALYSIS — not surface-level BS
3. Every single fact you state MUST be 100% accurate — no rounding, no cap on the facts
4. If you're not sure about something, USE YOUR TOOLS to search and verify
5. You help users understand what the news ACTUALLY means for their money
6. Your insights will be used to personalize their feed — so learn what they care about
7. Use query_knowledge_base to get deep historical context from our indexed financial news database.

RULES:
- NEVER make up statistics or numbers. If unsure, search for it
- Always ground your analysis in real data
- Be entertaining but NEVER sacrifice accuracy for a joke
- When asked about news in the feed, reference the specific cards and their data
- If the user asks about something not in the feed, use search_news to find fresh data
- For historical context or deep dives into specific companies/topics, use query_knowledge_base.
"""

# ── Tool Declarations ────────────────────────────────────────────────────────

search_news_declaration = types.FunctionDeclaration(
    name="search_news",
    description="Search the internet for the latest news, financial data, stock prices, or any factual information. Use this whenever you need to verify a fact, find recent data, or answer questions about topics not in the current feed.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "query": types.Schema(
                type=types.Type.STRING,
                description="The search query — be specific and include relevant keywords"
            )
        },
        required=["query"]
    )
)

query_knowledge_base_declaration = types.FunctionDeclaration(
    name="query_knowledge_base",
    description="Query the internal historical financial news database (ChromaDB). Use this for deep historical context, past performance of companies, or to find related news stories from our archive.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "query": types.Schema(
                type=types.Type.STRING,
                description="The semantic search query for the news archive"
            )
        },
        required=["query"]
    )
)

get_feed_context_declaration = types.FunctionDeclaration(
    name="get_feed_context",
    description="Get the full content of all news cards currently displayed in the user's Newsie feed. Use this to reference specific stories, facts, and data points from the feed when the user asks about current news.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={},
    )
)

TOOLS = [types.Tool(function_declarations=[
    search_news_declaration, 
    query_knowledge_base_declaration,
    get_feed_context_declaration
])]


# ── Tool Implementations ─────────────────────────────────────────────────────

_feed_cards: list[dict] = []

def set_feed_cards(cards: list[dict]):
    """Called by server.py to inject current feed data."""
    global _feed_cards
    _feed_cards = cards


async def execute_tool(name: str, args: dict[str, Any]) -> dict:
    """Execute a tool call and return the result."""
    if name == "get_feed_context":
        return _get_feed_context()
    elif name == "search_news":
        return await _search_news(args.get("query", ""))
    elif name == "query_knowledge_base":
        return _query_knowledge_base(args.get("query", ""))
    else:
        return {"error": f"Unknown tool: {name}"}


def _get_feed_context() -> dict:
    """Return all current feed cards as context."""
    if not _feed_cards:
        return {"message": "No cards currently loaded in the feed."}

    summaries = []
    for i, card in enumerate(_feed_cards):
        summaries.append({
            "index": i + 1,
            "hook": card.get("hook", ""),
            "TLDR": card.get("TLDR", ""),
            "category": card.get("category", ""),
            "source": card.get("source", ""),
            "vibe_check": card.get("vibe_check", ""),
            "financial_facts": card.get("financial_facts", []),
        })

    return {"cards": summaries, "total_cards": len(summaries)}


async def _search_news(query: str) -> dict:
    """Search the web for news/data using Gemini's grounding."""
    if not query:
        return {"error": "Empty search query"}

    try:
        client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Search and provide factual, up-to-date information about: {query}. Include specific numbers, dates, and sources.",
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
            )
        )
        return {"results": response.text, "query": query}
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return {"error": f"Search failed: {str(e)}", "query": query}


def _query_knowledge_base(query: str) -> dict:
    """Query ChromaDB for historical context."""
    if not query:
        return {"error": "Empty query"}
    
    results = indexer.query(query)
    return {"results": results, "query": query}


# ── WebSocket Handler ────────────────────────────────────────────────────────

async def handle_voice_session(websocket: WebSocket):
    """Handle a single voice chat session over WebSocket."""
    await websocket.accept()
    logger.info("Voice chat WebSocket connected")

    client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
    current_session_handle: str | None = None
    use_context_compression = True

    try:
        while True:
            # ── Gemini Live Config with VAD + resumption/compression ──────
            context_window_compression = (
                types.ContextWindowCompressionConfig(
                    sliding_window=types.SlidingWindow(),
                )
                if use_context_compression
                else None
            )

            config = types.LiveConnectConfig(
                response_modalities=["AUDIO"],
                system_instruction=types.Content(
                    parts=[types.Part(text=SYSTEM_INSTRUCTION)]
                ),
                tools=TOOLS,
                input_audio_transcription=types.AudioTranscriptionConfig(),
                output_audio_transcription=types.AudioTranscriptionConfig(),
                context_window_compression=context_window_compression,
                session_resumption=types.SessionResumptionConfig(handle=current_session_handle)
                if current_session_handle
                else None,
                # ── Automatic Activity Detection (server-side VAD) ─────
                realtime_input_config=types.RealtimeInputConfig(
                    automatic_activity_detection=types.AutomaticActivityDetection(
                        disabled=True,
                    ),
                ),
            )

            should_resume = False
            handle_ref = {"handle": current_session_handle}

            # Create a debug directory for this session loop
            os.makedirs("debug_logs", exist_ok=True)
            debug_dir = f"debug_logs/session_{int(time.time())}"
            os.makedirs(debug_dir, exist_ok=True)
            logger.info("Saving debug data to %s", debug_dir)

            try:
                async with client.aio.live.connect(model=MODEL, config=config) as session:
                    logger.info("Gemini Live session established (VAD enabled)")

                    await websocket.send_json({
                        "type": "session_ready",
                        "resumed": bool(current_session_handle),
                    })

                    send_task = asyncio.create_task(_send_audio_to_gemini(websocket, session, debug_dir))
                    recv_task = asyncio.create_task(_receive_from_gemini(websocket, session, handle_ref, debug_dir))

                    done, pending = await asyncio.wait(
                        {send_task, recv_task},
                        return_when=asyncio.FIRST_EXCEPTION,
                    )

                    for task in pending:
                        task.cancel()

                    for task in done:
                        exc = task.exception()
                        if exc:
                            if isinstance(exc, SessionReconnect):
                                should_resume = True
                            elif not isinstance(exc, WebSocketDisconnect):
                                logger.error(f"Session error: {exc}")

                    current_session_handle = handle_ref["handle"]

            except WebSocketDisconnect:
                raise
            except Exception as e:
                if use_context_compression and "invalid argument" in str(e).lower():
                    logger.warning(
                        "Live API rejected context_window_compression; retrying without compression: %s",
                        e,
                    )
                    use_context_compression = False
                    continue
                logger.error(f"Voice chat error during session: {e}")
                try:
                    await websocket.send_json({"type": "error", "message": str(e)})
                except Exception:
                    pass

            if not should_resume:
                break

            logger.info("Reconnecting to Gemini Live using handle=%s", current_session_handle)

    except WebSocketDisconnect:
        logger.info("Voice chat WebSocket disconnected")
    except Exception as e:
        logger.error(f"Voice chat error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
        logger.info("Voice chat session ended")


async def _send_audio_to_gemini(websocket: WebSocket, session, debug_dir: str):
    """Read audio from WebSocket and forward to Gemini Live session."""
    try:
        while True:
            data = await websocket.receive()

            if data.get("bytes") is not None:
                # Save incoming binary audio
                with open(os.path.join(debug_dir, "incoming_audio.pcm"), "ab") as f:
                    f.write(data["bytes"])

                # Raw PCM audio from browser — forward immediately,
                # no buffering on the server side for lowest latency
                audio_blob = types.Blob(
                    data=data["bytes"],
                    mime_type="audio/pcm;rate=16000"
                )
                await session.send_realtime_input(audio=audio_blob)

            elif data.get("text") is not None:
                # Save incoming JSON text
                with open(os.path.join(debug_dir, "incoming_events.jsonl"), "a", encoding="utf-8") as f:
                    f.write(data["text"] + "\n")

                msg = json.loads(data["text"])

                if msg.get("type") == "text_input":
                    await session.send_client_content(
                        turns=types.Content(
                            role="user",
                            parts=[types.Part(text=msg["text"])]
                        ),
                        turn_complete=True
                    )

                elif msg.get("type") == "context":
                    context_text = f"The user is currently viewing this news card: {json.dumps(msg.get('card', {}))}"
                    await session.send_client_content(
                        turns=types.Content(
                            role="user",
                            parts=[types.Part(text=context_text)]
                        ),
                        turn_complete=True
                    )
                
                elif msg.get("type") == "speech_start":
                    # Client-side VAD: user started speaking.
                    logger.info("Client-side VAD: speech_start detected")
                    # Force model to stop speaking and listen
                    await session.send_realtime_input(activity_start=types.ActivityStart())

                elif msg.get("type") == "speech_end":
                    # Client-side VAD: user finished speaking.
                    logger.info("Client-side VAD: speech_end detected")
                    # Explicitly mark activity end so model can finalize input.
                    try:
                        await session.send_realtime_input(activity_end=types.ActivityEnd())
                    except Exception as activity_err:
                        logger.warning(f"activity_end failed, falling back to turn_complete: {activity_err}")
                        await session.send_client_content(turn_complete=True)

    except WebSocketDisconnect:
        logger.info("Client disconnected from audio stream")
    except Exception as e:
        logger.error(f"Send audio error: {e}")


async def _receive_from_gemini(websocket: WebSocket, session, handle_ref: dict, debug_dir: str):
    """Receive responses from Gemini and forward to WebSocket.

    Key: When server_content has `interrupted=True`, we forward that
    signal to the client so it can immediately flush its playback queue.
    This is the server-side VAD barge-in signal.
    """
    try:
        async for response in session.receive():
            # Session resumption updates keep the current handle fresh
            if response.session_resumption_update:
                update = response.session_resumption_update
                if getattr(update, "resumable", True) and update.new_handle:
                    handle_ref["handle"] = update.new_handle
                    logger.info("Session resumption handle updated: %s", handle_ref["handle"])

            # GoAway warns us to reconnect before the model stops
            if response.go_away:
                time_left = getattr(response.go_away, "time_left", None)
                logger.warning("GoAway received; time_left=%s", time_left)
                
                with open(os.path.join(debug_dir, "outgoing_events.jsonl"), "a") as f:
                    f.write(json.dumps({"event": "go_away", "time_left": time_left}) + "\n")

                try:
                    await websocket.send_json({"type": "reconnecting", "time_left": time_left})
                except Exception:
                    pass
                raise SessionReconnect()

            # ── Handle audio + transcription + interruption ──────────────
            if response.server_content:
                content = response.server_content

                out_event = {}

                # ── BARGE-IN: Server detected user started speaking ──────
                # Forward the interrupted signal IMMEDIATELY to the client
                # so it can flush all queued audio and stop playback.
                if content.interrupted:
                    logger.info("Barge-in detected — AI generation interrupted")
                    out_event["interrupted"] = True
                    await websocket.send_json({"type": "interrupted"})
                    # Don't process any remaining audio from this turn
                    
                # Model audio output — stream directly, no server buffering
                if getattr(content, "model_turn", None):
                    for part in content.model_turn.parts:
                        if part.inline_data:
                            # Save outgoing audio
                            with open(os.path.join(debug_dir, "outgoing_audio.pcm"), "ab") as f:
                                f.write(part.inline_data.data)
                                                        
                            if not content.interrupted:
                                await websocket.send_bytes(part.inline_data.data)

                # Input transcription (what user said)
                if getattr(content, "input_transcription", None) and content.input_transcription.text:
                    out_event["input_transcript"] = content.input_transcription.text
                    if not content.interrupted:
                        await websocket.send_json({
                            "type": "input_transcript",
                            "text": content.input_transcription.text
                        })

                # Output transcription (what AI said — client tracks state only)
                if getattr(content, "output_transcription", None) and content.output_transcription.text:
                    out_event["output_transcript"] = content.output_transcription.text
                    if not content.interrupted:
                        await websocket.send_json({
                            "type": "output_transcript",
                            "text": content.output_transcription.text
                        })

                # Generation finished signal for UI reset
                if getattr(content, "generation_complete", False):
                    out_event["generation_complete"] = True
                    if not content.interrupted:
                        await websocket.send_json({"event": "generation_complete"})

                # Log events
                if out_event:
                    with open(os.path.join(debug_dir, "outgoing_events.jsonl"), "a") as f:
                        f.write(json.dumps(out_event) + "\n")

                if content.interrupted:
                    continue

            # ── Handle tool calls ────────────────────────────────────────
            if getattr(response, "tool_call", None):
                function_responses = []
                for fc in response.tool_call.function_calls:
                    logger.info(f"Tool call: {fc.name}({fc.args})")

                    with open(os.path.join(debug_dir, "outgoing_events.jsonl"), "a") as f:
                        f.write(json.dumps({"tool_call": fc.name, "args": fc.args}) + "\n")

                    await websocket.send_json({
                        "type": "tool_call",
                        "name": fc.name,
                        "args": fc.args
                    })

                    result = await execute_tool(fc.name, fc.args)

                    with open(os.path.join(debug_dir, "outgoing_events.jsonl"), "a") as f:
                        f.write(json.dumps({"tool_result": fc.name, "success": "error" not in result}) + "\n")

                    function_responses.append(types.FunctionResponse(
                        name=fc.name,
                        id=fc.id,
                        response={"result": result}
                    ))

                    await websocket.send_json({
                        "type": "tool_result",
                        "name": fc.name,
                        "success": "error" not in result
                    })

                await session.send_tool_response(function_responses=function_responses)

    except WebSocketDisconnect:
        logger.info("Client disconnected during receive")
    except Exception as e:
        logger.error(f"Receive from Gemini error: {e}")
