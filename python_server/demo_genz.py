import argparse
import sys
import json
from genz_editor import FinZEditor

def main():
    parser = argparse.ArgumentParser(description="Demo script for the Fin-Z Gen-Z News Card generator")
    parser.add_argument(
        "news_clip", 
        type=str, 
        nargs="?", 
        help="The raw boomer-tier news clipping to transform. If not provided, a default sample is used."
    )
    
    args = parser.parse_args()

    # Use the user's news clipping or default to a realistic example
    if args.news_clip:
        raw_news = args.news_clip
    else:
        print("No args provided. Using default boomer-tier report...\n")
        raw_news = (
            """Escalating Iran War Raises Global Alarm as Conflict Intensifies
March 24, 2026 | International Desk
The ongoing war involving Iran, Israel, and the United States has entered a dangerous new phase, with escalating missile attacks, rising casualties, and growing global economic disruption. Now in its fourth week, the conflict shows little sign of de-escalation, while fears of a broader regional war continue to mount.
Fresh Missile Strikes and Military Escalation
In one of the most significant recent developments, Iran launched a fresh wave of missile attacks targeting Israel, with at least one strike hitting central Tel Aviv and injuring multiple civilians. The attack caused significant structural damage and marked a continuation of Iran’s retaliatory campaign following U.S.-Israeli airstrikes on its territory. �
The Guardian +1
Israeli leadership has responded with strong rhetoric and intensified military action. Prime Minister Benjamin Netanyahu has vowed further strikes not only against Iran but also against Iranian-backed forces in Lebanon, signaling a widening scope of the conflict. �
The Guardian
Military analysts indicate that despite heavy losses—including the destruction of a large portion of Iran’s missile launch infrastructure—Iran retains the capability to carry out sustained attacks using missiles and drones. �
The Guardian
Rising Casualties and Regional Spillover
Casualty figures continue to climb on all sides. Reports suggest that thousands have been killed in Iran due to U.S.-Israeli strikes, while Israel has recorded thousands of injuries from ongoing missile attacks. �
The Guardian
The conflict has also spread beyond the immediate battlefield. Iranian strikes have reached Gulf nations such as Saudi Arabia, Bahrain, and the United Arab Emirates, raising concerns about a full-scale regional war. �
The Guardian
Additionally, Iran has targeted U.S. and allied military installations, including attempted strikes on a joint UK-U.S. base in the Indian Ocean, demonstrating its extended strike capability. �
The Guardian
Strategic Flashpoints: Strait of Hormuz
One of the most critical aspects of the war is the ongoing tension around the Strait of Hormuz, a vital global oil shipping route. Iran’s actions have significantly disrupted maritime traffic, prompting U.S. military efforts to reopen the passage through aerial campaigns. �
Wikipedia
The situation has heightened the risk of direct confrontation between major powers, with additional U.S. troop deployments and threats of further escalation if shipping routes remain blocked. �
The Washington Post
Economic Shockwaves Across the World
The war is already having severe global economic consequences. Oil prices have surged due to disruptions in supply chains, while financial markets face increased volatility. �
MarketWatch
In the United States, rising energy costs are contributing to inflation and slowing economic growth, with businesses cutting jobs and consumers facing higher prices. �
MarketWatch
The impact is also visible in India, where manufacturing activity has fallen to a multi-year low due to rising costs and weakened domestic demand. �
The Times of India
Meanwhile, global energy infrastructure has come under threat, with attacks on oil facilities and disruptions to major producers forcing companies to alter supply routes. �
Reuters
Diplomatic Uncertainty and Fading Hopes of Peace
Despite occasional claims of potential negotiations, both Iran and the United States have publicly denied meaningful diplomatic progress. Iranian officials have rejected reports of talks, while military actions continue on both sides. �
The Guardian
Experts warn that the absence of a clear exit strategy and increasing political divisions—especially within the United States—could prolong the conflict. �
Reuters
Conclusion
The Iran war has rapidly evolved into one of the most significant geopolitical crises in recent years. With active combat operations, regional spillover, and global economic repercussions, the situation remains highly volatile. Unless meaningful diplomatic intervention occurs, the risk of a prolonged and wider conflict continues to grow.
Sources:
Reuters
The Guardian
The Wall Street Journal
MarketWatch
The Times of India
The Washington Post
Al Jazeera
Economic Times"""
        )

    print("--- RAW FINANCIAL NEWS ---")
    print(raw_news)
    print("\n--------------------------\n")
    print("Feeding carefully to the Fin-Z Editor Agent...\n")

    try:
        # Initialize the pipeline
        editor = FinZEditor()
        
        # Transform the raw text
        card_data = editor.generate_news_card(raw_news)
        
        print("\n--- ✨ GEN-Z NEWS CARD (JSON) ✨ ---")
        # Dump the Pydantic model to a clean JSON string
        print(json.dumps(card_data.model_dump(), indent=2))

    except Exception as e:
        print(f"\n[ERROR] Pipeline failed: {str(e)}", file=sys.stderr)
        print("Did you ensure your .env file has a valid GOOGLE_API_KEY?", file=sys.stderr)

if __name__ == "__main__":
    main()
