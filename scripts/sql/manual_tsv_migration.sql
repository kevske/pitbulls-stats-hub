-- Manual migration script for TSV_game_number
-- Run this script in your Supabase SQL editor to add the TSV game numbering system

-- Step 1: Add the column
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS TSV_game_number INTEGER;

-- Step 2: Populate TSV_game_number for existing TSV Neuenstadt games
-- Use a CTE to properly order by date before numbering
WITH tsv_games_ordered AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY game_date ASC) as tsv_order
  FROM games 
  WHERE (
    LOWER(home_team_name) LIKE '%neuenstadt%' OR 
    LOWER(away_team_name) LIKE '%neuenstadt%' OR
    LOWER(home_team_name) LIKE '%pitbull%' OR 
    LOWER(away_team_name) LIKE '%pitbull%'
  )
)
UPDATE games 
SET TSV_game_number = tsv_order
FROM tsv_games_ordered 
WHERE games.id = tsv_games_ordered.id;

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_games_tsv_game_number ON games(TSV_game_number);

-- Step 4: Verify the numbering
SELECT 
  TSV_game_number,
  game_date,
  home_team_name,
  away_team_name,
  home_score,
  away_score
FROM games 
WHERE TSV_game_number IS NOT NULL
ORDER BY TSV_game_number;
