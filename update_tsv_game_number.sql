-- Update existing TSV_game_number column with proper chronological ordering
-- This script handles the case where the column already exists

-- Step 1: Reset existing TSV_game_number values for TSV games
UPDATE games 
SET TSV_game_number = NULL
WHERE (
  LOWER(home_team_name) LIKE '%neuenstadt%' OR 
  LOWER(away_team_name) LIKE '%neuenstadt%' OR
  LOWER(home_team_name) LIKE '%pitbull%' OR 
  LOWER(away_team_name) LIKE '%pitbull%'
);

-- Step 2: Repopulate TSV_game_number with proper chronological ordering
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

-- Step 3: Verify the updated numbering
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
