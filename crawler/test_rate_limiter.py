import unittest
import time
import sys
import os

# Add repo root to path to allow importing from crawler.main
sys.path.append(os.getcwd())

from crawler.rate_limiter import RateLimiter

class TestRateLimiter(unittest.TestCase):
    def test_rate_limiter_interval(self):
        """Test that rate limiter enforces minimum interval"""
        interval = 0.1
        rate_limiter = RateLimiter(min_interval=interval)

        start_time = time.time()
        iterations = 5

        for _ in range(iterations):
            rate_limiter.wait()
            # Simulate very fast work
            time.sleep(0.001)

        elapsed = time.time() - start_time

        # Expected minimum time: (iterations - 1) * interval
        # Because the first one is immediate
        expected_min_time = (iterations - 1) * interval

        self.assertGreaterEqual(elapsed, expected_min_time,
                               f"Elapsed time {elapsed:.4f}s should be >= {expected_min_time:.4f}s")

    def test_rate_limiter_slow_work(self):
        """Test that rate limiter doesn't add delay if work is slower than interval"""
        interval = 0.1
        work_time = 0.2 # Slower than interval
        rate_limiter = RateLimiter(min_interval=interval)

        start_time = time.time()
        iterations = 3

        for _ in range(iterations):
            rate_limiter.wait()
            time.sleep(work_time)

        elapsed = time.time() - start_time

        # Expected time is dominated by work time
        # iterations * work_time
        expected_time = iterations * work_time

        # Allow small margin for overhead
        self.assertGreaterEqual(elapsed, expected_time)
        # Should not be significantly more than expected (no extra sleeps)
        self.assertLess(elapsed, expected_time + 0.1)

if __name__ == '__main__':
    unittest.main()
