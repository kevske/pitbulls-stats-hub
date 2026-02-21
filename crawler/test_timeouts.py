import unittest
from unittest.mock import patch, MagicMock, call
import os
import sys

# Mock external dependencies before importing the module under test
sys.modules['requests'] = MagicMock()
sys.modules['supabase'] = MagicMock()
sys.modules['dotenv'] = MagicMock()
sys.modules['bs4'] = MagicMock()

# Add the parent directory to sys.path to allow imports from crawler
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crawler.main import BasketballBundCrawler

class TestTimeout(unittest.TestCase):
    def setUp(self):
        # Patch create_client
        self.patcher_client = patch('crawler.main.create_client')
        self.mock_create_client = self.patcher_client.start()
        self.mock_create_client.return_value = MagicMock()

        # Patch os.getenv
        self.patcher_getenv = patch('crawler.main.os.getenv')
        self.mock_getenv = self.patcher_getenv.start()

        def getenv_side_effect(key, default=None):
            env = {
                'SUPABASE_URL': 'https://example.com',
                'SUPABASE_KEY': 'dummy_key',
                'LEAGUE_ID': '123'
            }
            return env.get(key, default)

        self.mock_getenv.side_effect = getenv_side_effect

        # We need to mock requests.Session to return a mock object that we can inspect
        self.patcher_session = patch('crawler.main.requests.Session')
        self.mock_session_cls = self.patcher_session.start()
        self.mock_session_instance = MagicMock()
        self.mock_session_cls.return_value = self.mock_session_instance

        # Setup responses for the mock session
        response_mock = MagicMock()
        response_mock.json.return_value = {'status': '0', 'data': {}}
        response_mock.content = b"<html></html>"
        self.mock_session_instance.post.return_value = response_mock
        self.mock_session_instance.get.return_value = response_mock

        # Initialize crawler
        self.crawler = BasketballBundCrawler()

    def tearDown(self):
        patch.stopall()

    def test_fetch_competition_list_timeout(self):
        """Test that fetch_competition_list calls post with timeout"""
        self.crawler.fetch_competition_list()

        # Check if post was called with timeout
        args, kwargs = self.mock_session_instance.post.call_args
        self.assertIn('timeout', kwargs, "timeout parameter missing in fetch_competition_list")
        self.assertGreater(kwargs['timeout'], 0)

    def test_fetch_competition_table_timeout(self):
        """Test that fetch_competition_table calls get with timeout"""
        self.crawler.fetch_competition_table()

        # Check if get was called with timeout
        args, kwargs = self.mock_session_instance.get.call_args
        self.assertIn('timeout', kwargs, "timeout parameter missing in fetch_competition_table")
        self.assertGreater(kwargs['timeout'], 0)

    def test_fetch_competition_spielplan_timeout(self):
        """Test that fetch_competition_spielplan calls get with timeout"""
        self.crawler.fetch_competition_spielplan()

        # Check if get was called with timeout
        args, kwargs = self.mock_session_instance.get.call_args
        self.assertIn('timeout', kwargs, "timeout parameter missing in fetch_competition_spielplan")
        self.assertGreater(kwargs['timeout'], 0)

    def test_fetch_game_box_score_timeout(self):
        """Test that fetch_game_box_score calls get with timeout"""
        # Create a new session mock for the local session
        html_session_mock = MagicMock()
        response_mock = MagicMock()
        response_mock.content = b"<html></html>"
        html_session_mock.get.return_value = response_mock

        # Configure the Session class to return:
        # 1. self.mock_session_instance (init)
        # 2. html_session_mock (fetch_game_box_score)
        self.mock_session_cls.side_effect = [self.mock_session_instance, html_session_mock]

        # Re-init crawler to consume the first side_effect
        self.crawler = BasketballBundCrawler()

        # Now call the method
        game_data = {'homeTeam': {'teamPermanentId': '1'}, 'guestTeam': {'teamPermanentId': '2'}}
        self.crawler.fetch_game_box_score('12345', game_data)

        # Check html_session_mock.get call
        args, kwargs = html_session_mock.get.call_args
        self.assertIn('timeout', kwargs, "timeout parameter missing in fetch_game_box_score")
        self.assertGreater(kwargs['timeout'], 0)

if __name__ == '__main__':
    unittest.main()
