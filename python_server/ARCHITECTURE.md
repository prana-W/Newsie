# Newsie Architecture

This document outlines the communication flow and system architecture for the Newsie Gen-Z financial news platform.

## System Components

### 1. FastAPI Server (`server.py`)
- **Role:** Central orchestrator and API gateway.
- **Responsibilities:**
    - Serves the frontend static files.
    - Exposes `/api/samples` for pre-built content.
    - Exposes `/api/generate` for real-time news transformation.
    - Manages WebSocket connections for voice chat at `/ws/voice`.
    - Integrates the `FinZEditor`, `ImageService`, and `NewsIndexer`.

### 2. AI Content Engine (`genz_editor.py`)
- **Role:** Content transformation using Gemini 1.5 Pro.
- **Responsibilities:**
    - Translates raw financial news into "Gen-Z" speak.
    - Preserves all underlying financial data and facts.
    - Generates a structured `GenZNewsCard` JSON object including visual directions.

### 3. Image Service (`image_service.py`)
- **Role:** Dynamic visual generation.
- **Responsibilities:**
    - Receives `visual_direction` prompts from the AI Content Engine.
    - Generates and caches background images for news cards.
    - Ensures a consistent, cinematic aesthetic across the app.

### 4. Vector DB & RAG Pipeline (`main.py`)
- **Role:** Historical context and data grounding.
- **Responsibilities:**
    - Indexes raw news articles into ChromaDB using Gemini embeddings.
    - Provides semantic search capabilities via `NewsIndexer.query()`.
    - Enables the Voice Agent to ground its answers in historical data.

### 5. Financial Bestie Voice Layer (`voice_chat.py`)
- **Role:** Interactive real-time voice interface.
- **Responsibilities:**
    - Proxies bidirectional audio between the browser and Gemini Live API.
    - Implements natural barge-in mechanics (server-side + client-side VAD).
    - Manages session state, resumption handles, and context window compression.
    - Provides tool-use capabilities (`search_news`, `query_knowledge_base`, `get_feed_context`).

## Communication Flow

### Content Generation
1. Frontend sends raw article text to `/api/generate`.
2. `server.py` calls `FinZEditor.generate_news_card()`.
3. `FinZEditor` uses Gemini to produce structured JSON.
4. `server.py` calls `ImageService.generate_and_cache_image()` based on the output.
5. Final processed card is returned to the frontend.

### Real-time Voice Chat
1. Frontend establishes WebSocket at `/ws/voice`.
2. `handle_voice_session` starts a Gemini Live API session.
3. **User Input:**
    - Client-side **Silero VAD** detects speech start.
    - Client sends `{"type": "speech_start"}` to interrupt AI immediately.
    - Client streams raw PCM audio bytes to the server.
    - Server forwards audio directly to Gemini.
4. **AI Response:**
    - Gemini streams audio response back to the server.
    - Server forwards audio bytes to the client for playback.
    - Gemini provides real-time transcriptions and tool calls.
5. **RAG Integration:**
    - If user asks for historical context, Gemini calls `query_knowledge_base`.
    - `voice_chat.py` executes the tool by querying `NewsIndexer`.
    - Results are returned to Gemini to ground its response.

## Tech Stack
- **Backend:** FastAPI, Python 3.12+
- **AI:** Google GenAI (Gemini 2.5 Flash, 1.5 Pro)
- **Vector DB:** ChromaDB
- **Embeddings:** Gemini `text-embedding-004`
- **Frontend:** React, Vanilla CSS, Silero VAD
- **Package Manager:** uv
