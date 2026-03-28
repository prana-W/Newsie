# Newsie: AI-Powered Multi-Tier News Platform

Newsie is an advanced news aggregation and engagement platform built for a premium user experience. It leverages Retrieval-Augmented Generation (RAG) and high-performance AI models to bring news to life through personalized "vibes" and satirical AI caricature animations.

## 🚀 Key Features

- **AI Caricature Animations**: A "So Sorry" (Aaj Tak style) video generation engine that transforms boring news headlines into funny, satirical 3D slapstick animations using **VEO 3.1**.
- **Vibe Adaptation**: Instantly shift the tone and language of any news article (e.g., "Professional", "Gen-Z", "Sarcastic") with real-time AI rewrites.
- **Narrative Story Arcs**: Articles are semantic-routed into "Story Arcs," allowing users to follow the evolution of a topic over time, not just individual headlines.
- **Premium Real-Time UI**: A sleek, high-aesthetic React dashboard with smooth Framer Motion transitions and Lucide-icon-based navigation.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion, Radix UI.
- **Backend API**: Node.js, Express 5, MongoDB (Mongoose), JWT Auth.
- **AI/RAG Server**: Python 3.x, FastAPI, ChromaDB, Google GenAI (Gemini 2.5/2.0/3.0, VEO 3.1).

---

## 🏁 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.12+)
- [uv](https://github.com/astral-sh/uv) (for Python package management)
- MongoDB Atlas account
- Google Gemini API Key (with VEO 3.1 access)

### 2. RAG Server (Python)
The AI engine must be started first to handle semantic routing.
```bash
cd rag-server
# Setup .env with GOOGLE_API_KEY and MONGODB_URI
uv run main.py
```
*Runs on port 8100*

### 3. Backend API (Node.js)
```bash
cd server
npm install
# Setup .env with MONGODB_URI and JWT secrets
npm run dev
```
*Runs on port 8000*

### 4. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
*Runs on port 5173*

---

## 📖 Learn More
For a deep dive into the platform's multi-tier design and AI pipelines, see the [Architecture Documentation](./ARCHITECTURE.md).
