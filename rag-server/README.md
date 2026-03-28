# RAG Server (FastAPI + ChromaDB + Gemini)

This service handles AI routing for story arcs.

## Quick setup

1. Create env file:
   - Copy `.env.sample` to `.env`
   - Set `GOOGLE_API_KEY`
   - For Try Chroma, keep `CHROMA_MODE=cloud` and fill cloud variables

2. Install dependencies:

   ```bash
   uv sync
   ```

3. Run server:

   ```bash
   uv run python main.py
   ```

4. Verify:
   - `GET http://localhost:8100/health`

## MongoDB -> Gemini -> Chroma embedding sync

This service can backfill vectors by reading StoryArc topic summaries from
MongoDB, generating embeddings with Gemini, and upserting into ChromaDB.

### Required env vars

- `MONGODB_URI`
- `GOOGLE_API_KEY`
- Chroma cloud variables (`CHROMA_*`) when using cloud mode

Optional:

- `MONGO_DB_NAME` (if DB is already included in `MONGODB_URI`, this can be omitted)
- `MONGO_STORY_ARC_COLLECTION` (default: `story_arcs`)
- `GEMINI_EMBEDDING_MODEL` (default: `gemini-embedding-2-preview`)

### API endpoint

- `POST /rag/sync-embeddings-from-mongodb`

Request body:

```json
{
  "limit": 500,
  "batch_size": 100,
  "dry_run": false
}
```

Notes:

- `limit` is optional.
- `dry_run=true` validates and embeds but does not write to Chroma.
- Documents are read from MongoDB collection `story_arcs` and use `topic_summary`.

## ChromaDB modes

### Cloud (Try Chroma)

- `CHROMA_MODE=cloud`
- `CHROMA_HOST` can be either:
  - `https://<your-host>`
  - `<your-host>`
- Set `CHROMA_API_KEY`, `CHROMA_TENANT`, `CHROMA_DATABASE`
- Optional: `CHROMA_SSL=true`

### Local persistent Chroma

- `CHROMA_MODE=local`
- Set `CHROMA_PERSIST_DIR` (default `./.chroma`)
- Cloud-only variables are ignored in local mode
