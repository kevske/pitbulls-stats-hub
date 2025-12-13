#!/usr/bin/env python3
"""
Health check script for the BasketballBund crawler
"""
import os
import sys
from datetime import datetime, timedelta

try:
    from supabase import create_client
    
    # Test connection first
    print('Testing Supabase connection...')
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
    
    # Simple ping test
    result = supabase.table('scrape_log').select('count').limit(1).execute()
    print('Connection test successful')
    
    # Check recent data
    three_days_ago = datetime.utcnow() - timedelta(hours=72)
    result = supabase.table('scrape_log').select('*').eq('league_id', os.getenv('LEAGUE_ID')).gte('scraped_at', three_days_ago.isoformat()).execute()
    
    if len(result.data) == 0:
        print(f'ERROR: No recent data found in the last 72 hours for league {os.getenv("LEAGUE_ID")}')
        sys.exit(1)
    else:
        print(f'SUCCESS: Found {len(result.data)} recent scrape(s)')
        for scrape in result.data:
            print(f'  - {scrape["scraped_at"]}: {scrape["teams_count"]} teams, {scrape["games_count"]} games, {scrape["standings_count"]} standings')
            
except Exception as e:
    print(f'ERROR: Health check failed: {e}')
    sys.exit(1)
