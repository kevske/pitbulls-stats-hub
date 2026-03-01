import os
import unittest.mock
import sys

# Mock supabase to avoid key validation
sys.modules['supabase'] = unittest.mock.MagicMock()

from crawler.main import BasketballBundCrawler

# Mock env vars
os.environ['SUPABASE_URL'] = 'https://dummy.supabase.co'
os.environ['SUPABASE_KEY'] = 'dummy.dummy.dummy'
os.environ['LEAGUE_ID'] = '49400'

class TestCrawler(BasketballBundCrawler):
    def store_data(self, data):
        print(f"Would store: {len(data['teams'])} teams, {len(data['games'])} games, {len(data['standings'])} standings, {len(data['box_scores'])} box scores")
        pass
    def test_supabase_connection(self):
        pass

if __name__ == "__main__":
    crawler = TestCrawler()
    print("Starting fetch...")
    try:
        data = crawler.fetch_league_data()
        print(f"Success! Found {len(data['box_scores'])} box scores.")
    except Exception as e:
        import traceback
        traceback.print_exc()
