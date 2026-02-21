import unittest
from unittest.mock import patch, MagicMock
import os
import sys

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

if __name__ == '__main__':
    unittest.main()
