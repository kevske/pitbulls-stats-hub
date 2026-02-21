import unittest
from unittest.mock import patch, MagicMock
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

class TestBasketballBundCrawler(unittest.TestCase):
    @patch('crawler.main.create_client')
    @patch.dict(os.environ, {
        'SUPABASE_URL': 'https://example.com',
        'SUPABASE_KEY': 'dummy_key',
        'LEAGUE_ID': '123'
    })
    def setUp(self, mock_create_client):
        # Mock create_client to avoid actual connection
        mock_create_client.return_value = MagicMock()
        self.crawler = BasketballBundCrawler()

    def test_clean_url_none(self):
        """Test clean_url with None"""
        self.assertIsNone(self.crawler.clean_url(None))

    def test_clean_url_empty(self):
        """Test clean_url with empty string"""
        self.assertEqual(self.crawler.clean_url(""), "")

    def test_clean_url_valid_https(self):
        """Test clean_url with valid HTTPS URL"""
        url = "https://example.com"
        self.assertEqual(self.crawler.clean_url(url), url)

    def test_clean_url_valid_http(self):
        """Test clean_url with valid HTTP URL"""
        url = "http://example.com"
        self.assertEqual(self.crawler.clean_url(url), url)

    def test_clean_url_missing_protocol(self):
        """Test clean_url adds https protocol if missing"""
        url = "example.com"
        expected = "https://example.com"
        self.assertEqual(self.crawler.clean_url(url), expected)

    def test_clean_url_whitespace(self):
        """Test clean_url removes whitespace"""
        url = "  https://example.com  "
        expected = "https://example.com"
        self.assertEqual(self.crawler.clean_url(url), expected)

    def test_clean_url_non_printable(self):
        """Test clean_url removes non-printable characters"""
        url = "https://example.com\n\t"
        expected = "https://example.com"
        self.assertEqual(self.crawler.clean_url(url), expected)

    def test_clean_url_mixed(self):
        """Test clean_url with mixed issues (whitespace, non-printable, missing protocol)"""
        url = "  example.com\n\t  "
        expected = "https://example.com"
        self.assertEqual(self.crawler.clean_url(url), expected)

    def test_parse_score_pair_valid(self):
        """Test valid score pairs return correct integer values"""
        score_text = "85 : 78"
        self.assertEqual(self.crawler.parse_score_pair(score_text, 'home'), 85)
        self.assertEqual(self.crawler.parse_score_pair(score_text, 'away'), 78)

    def test_parse_score_pair_whitespace(self):
        """Test score pairs with varying whitespace"""
        # Leading/trailing whitespace around the whole string
        self.assertEqual(self.crawler.parse_score_pair("  85 : 78  ", 'home'), 85)
        # No spaces around colon
        self.assertEqual(self.crawler.parse_score_pair("85:78", 'away'), 78)
        # Extra spaces inside
        self.assertEqual(self.crawler.parse_score_pair("85  :   78", 'home'), 85)

    def test_parse_score_pair_invalid_format(self):
        """Test invalid formats return None"""
        # Missing colon
        self.assertIsNone(self.crawler.parse_score_pair("85 78", 'home'))
        # Empty string
        self.assertIsNone(self.crawler.parse_score_pair("", 'home'))
        # None input
        self.assertIsNone(self.crawler.parse_score_pair(None, 'home'))
        # Multiple colons
        self.assertIsNone(self.crawler.parse_score_pair("85 : 78 : 99", 'home'))

    def test_parse_score_pair_non_numeric(self):
        """Test non-numeric values are handled safely (return 0)"""
        # Both non-numeric
        self.assertEqual(self.crawler.parse_score_pair("AA : BB", 'home'), 0)
        self.assertEqual(self.crawler.parse_score_pair("AA : BB", 'away'), 0)
        # Mixed
        self.assertEqual(self.crawler.parse_score_pair("85 : BB", 'home'), 85)
        self.assertEqual(self.crawler.parse_score_pair("85 : BB", 'away'), 0)

    def test_parse_score_pair_partial(self):
        """Test partial scores (one side empty) return 0 for the missing side"""
        # Missing away score
        self.assertEqual(self.crawler.parse_score_pair("85 :", 'home'), 85)
        self.assertEqual(self.crawler.parse_score_pair("85 :", 'away'), 0)
        # Missing home score
        self.assertEqual(self.crawler.parse_score_pair(": 78", 'home'), 0)
        self.assertEqual(self.crawler.parse_score_pair(": 78", 'away'), 78)

if __name__ == '__main__':
    unittest.main()
