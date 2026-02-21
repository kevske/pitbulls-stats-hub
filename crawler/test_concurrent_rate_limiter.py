import unittest
import time
import threading
import sys
import os

# Add repo root to path
sys.path.append(os.getcwd())

from crawler.rate_limiter import RateLimiter

class TestConcurrentRateLimiter(unittest.TestCase):
    def test_concurrent_access(self):
        """Test that rate limiter enforces minimum interval with concurrent threads"""
        min_interval = 0.1
        rate_limiter = RateLimiter(min_interval=min_interval)

        num_threads = 5
        actions_per_thread = 2
        total_actions = num_threads * actions_per_thread

        start_times = []
        lock = threading.Lock()

        def worker():
            for _ in range(actions_per_thread):
                rate_limiter.wait()
                with lock:
                    start_times.append(time.time())
                # Simulate work
                time.sleep(0.01)

        threads = []
        test_start = time.time()

        for _ in range(num_threads):
            t = threading.Thread(target=worker)
            threads.append(t)
            t.start()

        for t in threads:
            t.join()

        # Check intervals between actions
        start_times.sort()

        # We expect total_actions - 1 intervals
        # Each interval should be >= min_interval (approximately)

        min_diff = float('inf')
        max_diff = 0
        violations = 0

        # print("\nStart times:")
        for i in range(len(start_times) - 1):
            diff = start_times[i+1] - start_times[i]
            # print(f"{i}: {start_times[i]:.4f} -> {diff:.4f}s")
            min_diff = min(min_diff, diff)
            max_diff = max(max_diff, diff)

            # Allow a small margin of error (e.g. 20ms) for OS scheduling
            if diff < (min_interval - 0.02):
                violations += 1

        # The total time should be at least (total_actions - 1) * min_interval
        total_duration = start_times[-1] - start_times[0]
        expected_duration = (total_actions - 1) * min_interval

        # print(f"\nTotal duration: {total_duration:.4f}s (Expected >= {expected_duration:.4f}s)")
        # print(f"Min diff: {min_diff:.4f}s")
        # print(f"Violations: {violations}")

        self.assertGreaterEqual(total_duration, expected_duration - 0.1,
                               f"Total duration {total_duration} too short for {total_actions} actions at {min_interval}s interval")

        self.assertEqual(violations, 0, f"Found {violations} interval violations")

if __name__ == '__main__':
    unittest.main()
