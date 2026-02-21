import time

class RateLimiter:
    """Simple rate limiter to ensure minimum interval between actions"""
    def __init__(self, min_interval=0.5):
        self.min_interval = min_interval
        self.last_action_time = 0

    def wait(self):
        """Wait if necessary to respect the minimum interval"""
        current_time = time.time()
        elapsed = current_time - self.last_action_time

        # If this isn't the first action, check if we need to wait
        if self.last_action_time > 0 and elapsed < self.min_interval:
            wait_time = self.min_interval - elapsed
            if wait_time > 0:
                time.sleep(wait_time)

        self.last_action_time = time.time()
