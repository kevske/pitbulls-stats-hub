-- Add quarter_scores column to games table
-- This migration adds support for storing quarter-by-quarter scores from basketball-bund.net

ALTER TABLE games 
ADD COLUMN quarter_scores JSONB;

-- Create index for better query performance on quarter scores
CREATE INDEX idx_games_quarter_scores ON games USING GIN(quarter_scores);

-- Add comment to document the structure
COMMENT ON COLUMN games.quarter_scores IS 'Quarter-by-quarter scores in format: {
  "first_quarter_home": number,
  "first_quarter_away": number,
  "halftime_home": number,
  "halftime_away": number,
  "third_quarter_home": number,
  "third_quarter_away": number
}';

-- Example query to test the structure
-- SELECT game_id, home_team_name, away_team_name, quarter_scores 
-- FROM games 
-- WHERE quarter_scores IS NOT NULL 
-- LIMIT 5;
