import os
import json
import logging
from typing import List, cast
from dotenv import load_dotenv

from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GenZNewsCard(BaseModel):
    """
    JSON Schema definition for the Gen-Z News Card output. 
    Pydantic ensures the LLM returns exactly the fields we need.
    """
    hook: str = Field(
        description="Start with a high-impact sentence that explains why this news is a 'Vibe' or a 'Major L' for the user's portfolio."
    )
    TLDR: str = Field(
        description="The main news summary using modern internet slang (e.g., rizz, stonks) and financial terms, written like a TikTok script."
    )
    financial_facts: List[str] = Field(
        description="A list of 100% accurate financial figures, company names, and market movements. No rounding, no cap on the facts."
    )
    vibe_check: str = Field(
        description="Short vibe check for the article, e.g., 'Major Vibe', 'Cooked', 'Major L', or 'Stonks'."
    )
    visual_direction: str = Field(
        description="Describe a (15-120)-second quirky AI video scene that visually represents the news."
    )


class FinZEditor:
    """
    Content generator pipeline applying the 'Fin-Z' persona using Gemini 
    to transform boomer-tier financial news into structured JSON News Cards.
    """

    def __init__(self, model_name: str = "gemini-3-flash-preview"):
        if not os.environ.get("GOOGLE_API_KEY"):
            raise ValueError("GOOGLE_API_KEY is not set. Please add it to your .env file.")
        
        # Initialize Gemini 1.5 Flash via LangChain, utilizing the native structural output capabilities
        logger.info(f"Initializing FinZEditor with model: {model_name}")
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=0.7,
            max_retries=2,
        ).with_structured_output(GenZNewsCard)

        # Build the exact prompt based on the specified guidelines
        self.prompt = PromptTemplate.from_template(
            """Role: You are "Fin-Z," a high-energy, financial literacy influencer and Senior Editor for ET's new Gen-Z News-Reel. Your specialty is taking "boomer-tier" financial reports and making them "slay" for a 20-year-old investor.

Task: Transform the provided raw news article into a structured "News Card" format.

Core Guidelines:
1. Accuracy is Non-Negotiable: You must keep all financial figures, company names, and market movements 100% accurate. If a profit is 10%, do not round it to "huge gains." No cap on the facts.
2. Linguistic Style: Use a mix of modern internet slang (e.g., rizz, stonks, big W, cooked, sending me, main character energy) and financial terms. Avoid being "cringe" by overusing slang; make it flow like a TikTok script.
3. Tone Constraints: 
   - Enthusiastic but knowledgeable.
   - Relatable to a student or early-career professional.
   - Sarcastic toward corporate jargon, but respectful of the money.

Raw News Article:
{article_content}
"""
        )

    def generate_news_card(self, article_content: str) -> GenZNewsCard:
        """
        Executes the LangChain processing pipeline to transform raw text 
        into a validated GenZNewsCard Pydantic object.
        """
        logger.info("Transforming raw article into Gen-Z News Card...")
        chain = self.prompt | self.llm
        
        # Generate the structured response
        response_card = chain.invoke({"article_content": article_content})
        
        # Tell the static type checker that this is guaranteed to be a GenZNewsCard
        return cast(GenZNewsCard, response_card)


if __name__ == "__main__":
    # Test Data simulating what might come out of the primary database
    sample_raw_news = (
        "The S&P 500 hit a new high today as tech stocks surged by 4.2%. "
        "Inflation data released by the Federal Reserve shows a decrease to 2.8%, "
        "which looks promising for the upcoming quarter. Big banks remain cautious."
    )

    try:
        editor = FinZEditor()
        card_data = editor.generate_news_card(sample_raw_news)
        
        print("\n--- Output JSON ---")
        # Outputting purely validated JSON ensuring schema compliance
        print(json.dumps(card_data.model_dump(), indent=2))
        
    except ValueError as ve:
        logger.error(ve)
    except Exception as e:
        logger.error(f"Failed to generate news card: {e}")