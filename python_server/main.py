import os
import logging
from typing import List, Dict, Any

from dotenv import load_dotenv
from bs4 import BeautifulSoup
import chromadb
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load environment variables (e.g., GOOGLE_API_KEY)
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GeminiEmbeddingFunction(EmbeddingFunction):
    """
    Custom ChromaDB embedding function wrapping LangChain's GoogleGenerativeAIEmbeddings.
    """
    def __init__(self, model_name: str = "models/text-embedding-004"):
        if not os.environ.get("GOOGLE_API_KEY"):
            raise ValueError("GOOGLE_API_KEY environment variable is not set. Please set it in your .env file.")
        # text-embedding-004 is optimal for Gemini 3 era / modern RAG systems
        self.llm = GoogleGenerativeAIEmbeddings(model=model_name)
        
    def __call__(self, input: Documents) -> Embeddings:
        """
        Generates and returns the embeddings for the given documents.
        """
        return self.llm.embed_documents(input)


class NewsIndexer:
    """
    A pipeline to sync, clean, semantically chunk, and index raw business news 
    into ChromaDB using Gemini embeddings.
    """
    
    def __init__(self, db_path: str = "./chroma_db", collection_name: str = "business_news") -> None:
        """
        Initializes the ChromaDB persistent client, embedding function, and text splitter.
        """
        logger.info(f"Initializing NewsIndexer with DB at '{db_path}'...")
        self.client = chromadb.PersistentClient(path=db_path)
        
        self.embedding_fn = GeminiEmbeddingFunction()
        
        # Get or create the ChromaDB collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_fn
        )
        
        # Semantic chunking: Falls back logically from paragraphs -> sentences -> words
        # to preserve context, avoiding splitting mid-sentence or mid-financial-figure.
        self.text_splitter = RecursiveCharacterTextSplitter(
            separators=["\n\n", "\n", ".", " ", ""],
            chunk_size=1000,
            chunk_overlap=150,
            length_function=len
        )

    def clean_html(self, raw_html: str) -> str:
        """
        Strips HTML tags using BeautifulSoup, preserving block-level structure 
        via newlines for semantic chunking.
        """
        if not raw_html:
            return ""
        
        soup = BeautifulSoup(raw_html, "html.parser")
        # Extract text adding logical double newlines between block elements
        clean_text = soup.get_text(separator="\n\n", strip=True)
        return clean_text

    def _is_article_indexed(self, article_id: str) -> bool:
        """
        Checks if an article is already present in ChromaDB by querying metadata.
        """
        results = self.collection.get(
            where={"article_id": article_id},
            limit=1,
            include=[]
        )
        return len(results.get("ids", [])) > 0

    def sync_from_db(self, articles: List[Dict[str, Any]]) -> None:
        """
        Ingests a list of article dictionaries, cleans, chunks, and indexes them.
        Skips articles whose `article_id` already exists in ChromaDB.
        
        articles expected format:
        [
            {
                "article_id": "string",
                "content": "<raw_html_string>",
                "timestamp": "string",
                "category": "string",
                "source_url": "string"
            }
        ]
        """
        if not articles:
            logger.warning("No articles provided to sync.")
            return

        total_chunks_indexed = 0
        articles_indexed = 0
        articles_skipped = 0

        # Accumulators for batch processing
        all_documents = []
        all_metadatas = []
        all_ids = []

        for article in articles:
            article_id = str(article.get("article_id"))
            
            # Check for duplicates to avoid re-indexing
            if self._is_article_indexed(article_id):
                logger.debug(f"Article {article_id} already exists. Skipping.")
                articles_skipped += 1
                continue

            raw_content = article.get("content", "")
            clean_text = self.clean_html(raw_content)
            
            if not clean_text:
                logger.warning(f"Article {article_id} yielded empty text after cleaning. Skipping.")
                continue

            # Apply semantic chunking based on structural boundaries
            chunks = self.text_splitter.split_text(clean_text)
            
            if not chunks:
                continue

            for i, chunk in enumerate(chunks):
                all_documents.append(chunk)
                all_ids.append(f"{article_id}_chunk_{i}")
                all_metadatas.append({
                    "article_id": article_id,
                    "timestamp": article.get("timestamp", ""),
                    "category": article.get("category", "Uncategorized"),
                    "source_url": article.get("source_url", "")
                })
            
            articles_indexed += 1

        # Process and embed in batches of 100
        batch_size = 100
        for i in range(0, len(all_documents), batch_size):
            batch_docs = all_documents[i:i + batch_size]
            batch_ids = all_ids[i:i + batch_size]
            batch_metadatas = all_metadatas[i:i + batch_size]
            
            try:
                self.collection.add(
                    documents=batch_docs,
                    metadatas=batch_metadatas,
                    ids=batch_ids
                )
                total_chunks_indexed += len(batch_docs)
                logger.info(f"Indexed batch of {len(batch_docs)} chunks (items {i + 1} to {i + len(batch_docs)})...")
            except Exception as e:
                logger.error(f"Failed to index batch starting at index {i}. Error: {e}")

        logger.info("--- Sync Complete ---")
        logger.info(f"Articles indexed: {articles_indexed}")
        logger.info(f"Articles skipped (duplicates): {articles_skipped}")
        logger.info(f"Total new chunks added to Vector DB: {total_chunks_indexed}")


    def query(self, query_text: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Queries the ChromaDB collection for the most relevant news chunks.
        """
        logger.info(f"Querying ChromaDB for: '{query_text}'")
        try:
            results = self.collection.query(
                query_texts=[query_text],
                n_results=n_results,
                include=["documents", "metadatas", "distances"]
            )
            
            formatted_results = []
            if results["documents"]:
                for i in range(len(results["documents"][0])):
                    formatted_results.append({
                        "content": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "distance": results["distances"][0][i]
                    })
            return formatted_results
        except Exception as e:
            logger.error(f"Query failed: {e}")
            return []

if __name__ == "__main__":
    # Example manually triggering the Sync & Embed Pipeline
    dummy_articles = [
        {
            "article_id": "ET_2026_001",
            "content": "<h1>AI Startup Raises $100M</h1><p>In a massive Series B, the startup dominated tech news.</p><br><p>Investors are hopeful about their new edge models.</p>",
            "timestamp": "2026-03-24T10:00:00Z",
            "category": "Funding",
            "source_url": "https://et.news/ai-startup"
        },
        {
            "article_id": "ET_2026_002",
            "content": "<h2>Market Wrap 2026</h2><p>The S&P 500 hit a new high today as tech stocks surged.</p><p>Inflation data looks promising for the upcoming quarter.</p>",
            "timestamp": "2026-03-24T16:30:00Z",
            "category": "Markets",
            "source_url": "https://et.news/market-wrap"
        }
    ]
    
    # Needs valid GOOGLE_API_KEY inside the newly created .env file
    try:
        indexer = NewsIndexer()
        
        logger.info("Executing Primary Sync...")
        indexer.sync_from_db(dummy_articles)
        
        logger.info("Executing Secondary Sync to Verify Deduplication...")
        indexer.sync_from_db(dummy_articles)
        
    except ValueError as ve:
        logger.error(ve)
