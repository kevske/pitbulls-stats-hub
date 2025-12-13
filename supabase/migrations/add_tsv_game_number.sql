-- Add TSV_game_number column for sequential TSV Neuenstadt game numbering
-- This will provide a simple, comprehensive numbering system (1, 2, 3...) 
-- that only counts TSV Neuenstadt games, making website communication clearer

-- Step 1: Add the column
ALTER TABLE games 
ADD COLUMN TSV_game_number INTEGER;

-- Step 2: Create a temporary sequence for numbering
CREATE TEMPORARY SEQUENCE temp_tsv_game_number_seq;

-- Step 3: Populate TSV_game_number for existing TSV Neuenstadt games
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

-- Step 4: Clean up the temporary sequence
DROP SEQUENCE temp_tsv_game_number_seq;

-- Step 5: Add index for performance
CREATE INDEX idx_games_tsv_game_number ON games(TSV_game_number);

-- Step 6: Add comment for documentation
COMMENT ON COLUMN games.TSV_game_number IS 'Sequential game number for TSV Neuenstadt games only (1, 2, 3, ...). Used for website communication and video mapping.';

-- Step 7: Verify the numbering
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
