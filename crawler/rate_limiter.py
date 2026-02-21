import time
import threading

class RateLimiter:
    """Simple rate limiter to ensure minimum interval between actions"""
    def __init__(self, min_interval=0.5):
        self.min_interval = min_interval
        self.last_action_time = 0
        self.lock = threading.Lock()

    def wait(self):
        """Wait if necessary to respect the minimum interval"""
        with self.lock:
            current_time = time.time()

            # If this is the first action (last_action_time is 0),
            # we don't need to add min_interval to it.
            if self.last_action_time == 0:
                target_time = current_time
            else:
                # Calculate when we can perform the next action
                # It must be at least min_interval since the last scheduled action
                target_time = max(current_time, self.last_action_time + self.min_interval)

            # Calculate how long to wait
            sleep_needed = target_time - current_time

            # Update last_action_time to the target time (when this action will effectively happen)
            self.last_action_time = target_time

        if sleep_needed > 0:
            time.sleep(sleep_needed)
