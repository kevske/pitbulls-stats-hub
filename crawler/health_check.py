#!/usr/bin/env python3
"""
Health check script for the BasketballBund crawler.

Schlägt fehl (Exit-Code 1), wenn in den letzten 72 Stunden kein
erfolgreicher Crawler-Lauf in scrape_log protokolliert wurde. Die Liga-ID
kommt aus der seasons-Tabelle (is_current); das LEAGUE_ID-Env dient nur
noch als optionaler Filter-Fallback.
"""
import os
import sys
from datetime import datetime, timedelta, timezone

try:
    from supabase import create_client

    # Test connection first
    print('Testing Supabase connection...')
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

    # Simple ping test
    result = supabase.table('scrape_log').select('count').limit(1).execute()
    print('Connection test successful')

    # Liga-ID der aktuellen Saison ermitteln (Fallback: LEAGUE_ID env)
    league_id = os.getenv('LEAGUE_ID')
    try:
        season_result = supabase.table('seasons').select('league_id, name').eq('is_current', True).limit(1).execute()
        if season_result.data:
            league_id = str(season_result.data[0]['league_id'])
            print(f"Current season: {season_result.data[0]['name']} (league {league_id})")
    except Exception as e:
        print(f'Note: could not read seasons table ({e}), using LEAGUE_ID env')

    # Check recent data
    three_days_ago = datetime.now(timezone.utc) - timedelta(hours=72)
    query = supabase.table('scrape_log').select('*').eq('status', 'success').gte('scraped_at', three_days_ago.isoformat())
    if league_id:
        query = query.eq('league_id', league_id)
    result = query.execute()

    if len(result.data) == 0:
        print('ERROR: No successful scrape found in the last 72 hours' + (f' for league {league_id}' if league_id else ''))
        sys.exit(1)
    else:
        print(f'SUCCESS: Found {len(result.data)} recent scrape(s)')
        for scrape in result.data:
            print(f'  - {scrape["scraped_at"]}: {scrape["teams_count"]} teams, {scrape["games_count"]} games, {scrape["standings_count"]} standings')

except Exception as e:
    print(f'ERROR: Health check failed: {e}')
    sys.exit(1)
