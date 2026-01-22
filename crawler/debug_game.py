import os
import sys
import asyncio
import logging
from dotenv import load_dotenv

# Ensure we can import main
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import BasketballBundCrawler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DebugCrawler(BasketballBundCrawler):
    def fetch_competition_spielplan(self):
        print("DEBUG: Fetching spielplan...")
        games = super().fetch_competition_spielplan()
        target_games = [g for g in games if str(g.get('matchId')) == '2786721']
        print(f"DEBUG: Filtered to {len(target_games)} games.")
        if target_games:
            print(f"DEBUG: Game Data: Result='{target_games[0].get('result')}' Confirmed={target_games[0].get('ergebnisbestaetigt')}")
        return target_games

async def debug_run():
    crawler = DebugCrawler()
    print("DEBUG: initialized crawler")
    
    games = crawler.fetch_competition_spielplan()
    if not games:
        print("DEBUG: No game found!")
        return

    print("DEBUG: Fetching box scores...")
    box_scores, qs_updates = await crawler.fetch_box_scores_async(games)
    
    print(f"DEBUG: Fetched {len(box_scores)} box score entries.")
    if len(box_scores) > 0:
        print("DEBUG: Sample entries:")
        for bs in box_scores[:5]:
             print(f"  - {bs.get('player_first_name')} {bs.get('player_last_name')}: {bs.get('points')} pts")
    else:
        print("DEBUG: No box scores fetched. Checking why...")
        # Check logic
        game = games[0]
        result = game.get('result')
        if not (result and ':' in result):
            print("DEBUG: Game skipped because result invalid.")
        else:
            print("DEBUG: Game should be processed. Checking single fetch...")
            # Try single fetch synchronously to debug
            # Use raw fetch code from main.py logic if needed, but let's just inspect
            pass

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(debug_run())
