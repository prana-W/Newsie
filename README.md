# 📰 Newsie: AI-Powered Multi-Tier News Platform

Newsie is a next-generation news aggregation and engagement platform designed to transform how users consume information. By combining **Retrieval-Augmented Generation (RAG)** with advanced generative AI models, Newsie delivers **personalized, interactive, and immersive news experiences**.

Instead of passively reading headlines, users can **explore, interact, visualize, and understand news in depth**.

---

## 🚀 Key Features

### 🎥 AI Caricature Video Generation
Transform traditional news articles into engaging, satirical **“So Sorry” (Aaj Tak style)** animations using **VEO 3.1**.  
This converts static content into dynamic, shareable video experiences.

---

### 🎭 Vibe Adaptation Engine
Instantly rewrite news content into different tones and styles:
- Professional  
- Gen-Z  
- Sarcastic  
- Simplified  

Powered by efficient LLM pipelines for real-time transformation.

---

### 🧵 Narrative Story Arcs
Articles are semantically grouped into **Story Arcs**, enabling users to:
- Follow the evolution of a topic  
- Understand context over time  
- Avoid fragmented news consumption  

---

### 🎤 Context-Aware Voice Interaction
Interact with news using voice:
- Ask questions  
- Discuss topics  
- Explore perspectives  

The AI maintains **context awareness of the current article**, enabling meaningful conversations instead of generic responses.

---

### 🤖 RAG-Based Recommendation System
Leverages **ChromaDB + embeddings** for semantic similarity:
- Recommends related news based on meaning, not keywords  
- Improves content discovery  
- Enhances user engagement  

---

### 🌍 Real-Time Multilingual Translation
Supports dynamic translation across languages while preserving:
- Tone  
- Context  
- Meaning  

Enables global accessibility of content.

---

### 🎨 Premium UI/UX Experience
Built with a focus on:
- Smooth micro-interactions  
- High-performance rendering  
- Elegant, modern design  

Ensures a **high-engagement, production-grade user experience**.

---

## 🏗 Architecture Overview

Newsie follows a **scalable three-tier architecture**:

```

Frontend (React)
↓
Node.js Backend (Orchestration Layer)
↓
Python RAG Server (AI Intelligence Layer)

````

### 🔹 Frontend
- React 19 + Vite + Tailwind CSS 4  
- Framer Motion for animations  
- Radix UI + Lucide icons  
- Real-time UI interactions  

---

### 🔹 Backend (Node.js)
- Express 5 + Mongoose  
- JWT-based authentication  
- Socket.io for real-time updates  
- Caching layer for AI responses  

Acts as the **orchestrator**, routing requests and optimizing performance.

---

### 🔹 AI / RAG Server (Python)
- FastAPI + ChromaDB  
- Gemini (2.5 / 3.x) for reasoning and generation  
- VEO 3.1 for video generation  

Handles:
- Semantic routing  
- Content transformation  
- Video generation pipeline  

---

## 🛠 Tech Stack

### Frontend
- React 19  
- Vite  
- Tailwind CSS 4  
- Framer Motion  
- Radix UI  

### Backend
- Node.js  
- Express 5  
- MongoDB (Mongoose)  
- JWT Authentication  

### AI / RAG
- Python 3.x  
- FastAPI  
- ChromaDB  
- Google GenAI (Gemini, VEO 3.1)  

---

## 🏁 Quick Start

### 1. Prerequisites
- Node.js (v18+)  
- Python (v3.12+)  
- uv (Python package manager)  
- MongoDB Atlas account  
- Google Gemini API Key (with VEO access)  

---

### 2. Start RAG Server (AI Layer)

```bash
cd rag-server
# Configure .env with GOOGLE_API_KEY and MONGODB_URI
uv run main.py
````

Runs on **http://localhost:8100**

---

### 3. Start Backend API

```bash
cd server
npm install
# Configure .env with MONGODB_URI and JWT secrets
npm run dev
```

Runs on **http://localhost:8000**

---

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on **http://localhost:5173**

---

## 📊 Why Newsie?

Newsie redefines news consumption by combining:

* 🧠 AI-driven personalization
* 🎥 Visual storytelling
* 🎤 Interactive engagement
* 🔍 Semantic intelligence

It transforms news from **passive reading → active experience**.

---

## 📖 Documentation

For a deeper understanding of system design and pipelines, refer to:

👉 `ARCHITECTURE.md`

---

## 🏁 Conclusion

Newsie is not just a news platform — it is an **AI-powered information experience engine** that bridges content, context, and interaction.

---
