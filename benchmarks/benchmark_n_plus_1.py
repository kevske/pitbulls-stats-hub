import time
import sys
import os
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone

# Add parent directory to path to import crawler
sys.path.append('.')

# Mock dependencies
sys.modules['supabase'] = MagicMock()
sys.modules['requests'] = MagicMock()
sys.modules['bs4'] = MagicMock()
sys.modules['dotenv'] = MagicMock()

# Mock environment variables for init
with patch.dict(os.environ, {
    'SUPABASE_URL': 'https://example.supabase.co',
    'SUPABASE_KEY': 'fake-key',
    'LEAGUE_ID': '123'
}):
    from crawler.main import BasketballBundCrawler

class BenchmarkNPlus1:
    def __init__(self, num_games=50):
        self.num_games = num_games

        with patch.dict(os.environ, {
            'SUPABASE_URL': 'https://example.supabase.co',
            'SUPABASE_KEY': 'fake-key',
            'LEAGUE_ID': '123'
        }):
            self.crawler = BasketballBundCrawler()

        # Mock the supabase client methods
        self.crawler.supabase = MagicMock()

        # Setup mocks for N+1 approach (update -> eq -> execute)
        self.update_mock = MagicMock()
        self.eq_mock = MagicMock()

        self.crawler.supabase.table.return_value.update.return_value = self.update_mock
        self.update_mock.eq.return_value = self.eq_mock
        self.eq_mock.execute.side_effect = self.simulate_network_delay

        # Setup mocks for Batch approach (upsert -> execute)
        self.upsert_mock = MagicMock()
        self.crawler.supabase.table.return_value.upsert.return_value = self.upsert_mock
        self.upsert_mock.execute.side_effect = self.simulate_network_delay

    def simulate_network_delay(self, *args, **kwargs):
        # Simulate network latency (e.g., 50ms)
        time.sleep(0.05)
        return MagicMock(data=[{}])

    def run_original(self):
        print(f"Running original N+1 updates for {self.num_games} games...")
        start_time = time.time()

        for i in range(self.num_games):
            game_id = str(i)
            quarter_scores = {
                'first_quarter_home': 20, 'first_quarter_away': 18,
                'halftime_home': 40, 'halftime_away': 38,
                'third_quarter_home': 60, 'third_quarter_away': 58
            }
            # Simulate what the old method did since it is now removed
            update_data = {
                'quarter_scores': quarter_scores,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            self.crawler.supabase.table('games').update(update_data).eq('game_id', game_id).execute()

        duration = time.time() - start_time
        print(f"Original duration: {duration:.4f} seconds")
        print(f"Average time per update: {duration/self.num_games:.4f} seconds")
        return duration

    def run_optimized_simulation(self):
        # Using the new batch_update_quarter_scores method
        print(f"Running optimized batch update for {self.num_games} games...")
        start_time = time.time()

        updates = []
        for i in range(self.num_games):
            game_id = str(i)
            quarter_scores = {
                'first_quarter_home': 20, 'first_quarter_away': 18,
                'halftime_home': 40, 'halftime_away': 38,
                'third_quarter_home': 60, 'third_quarter_away': 58
            }
            updates.append((game_id, quarter_scores))

        # Call the new method
        self.crawler.batch_update_quarter_scores(updates)

        duration = time.time() - start_time
        print(f"Optimized duration: {duration:.4f} seconds")
        return duration

if __name__ == "__main__":
    benchmark = BenchmarkNPlus1(num_games=20)
    original_time = benchmark.run_original()
    optimized_time = benchmark.run_optimized_simulation()

    improvement = original_time - optimized_time
    print(f"\nExpected Improvement: {improvement:.4f} seconds ({original_time/optimized_time:.1f}x faster)")
