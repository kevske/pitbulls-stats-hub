# BasketballBund Crawler

This Python crawler fetches data from basketball-bund.net REST API and stores it in Supabase.

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials:
   ```
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_KEY=your_supabase_key_here
   # Optional fallback only:
   LEAGUE_ID=your_league_id_here
   ```

   The crawler reads the league id and the Pitbulls team id from the
   `seasons` table (row with `is_current = true`). Starting a new season
   only requires inserting a new row there — see `docs/SEASON_HANDOVER.md`.
   `LEAGUE_ID` is a fallback for databases without the seasons table.

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the crawler:
   ```bash
   python main.py
   ```

## GitHub Actions

This crawler is automatically run every second night at 2:00 AM UTC via GitHub Actions. You can also trigger it manually from the Actions tab in GitHub.

## Data Collected

- Team information
- Game schedules and results
- League standings
- Box scores (when available)

The crawler logs all scraping activities to the `scrape_log` table in Supabase for monitoring and debugging purposes.
