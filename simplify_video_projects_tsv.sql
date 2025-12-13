-- Simplify video_projects table to use TSV_game_number directly
-- This eliminates redundancy and ensures consistency

-- Step 1: Add TSV_game_number column to video_projects table
ALTER TABLE video_projects 
ADD COLUMN IF NOT EXISTS TSV_game_number INTEGER;

-- Step 2: Populate TSV_game_number by joining with games table
UPDATE video_projects vp
SET TSV_game_number = g.TSV_game_number
FROM games g
WHERE vp.game_number = g.game_id::TEXT
AND g.TSV_game_number IS NOT NULL
AND (
  LOWER(g.home_team_name) LIKE '%neuenstadt%' OR 
  LOWER(g.away_team_name) LIKE '%neuenstadt%' OR
  LOWER(g.home_team_name) LIKE '%pitbull%' OR 
  LOWER(g.away_team_name) LIKE '%pitbull%'
);

-- Step 3: Create new unique constraint for TSV_game_number and video_index
ALTER TABLE video_projects 
ADD CONSTRAINT video_projects_tsv_game_video_index_unique 
UNIQUE(TSV_game_number, video_index);

-- Step 4: Add index for performance
CREATE INDEX IF NOT EXISTS idx_video_projects_tsv_game_number 
ON video_projects(TSV_game_number);

-- Step 5: Verify the migration
SELECT 
  vp.TSV_game_number,
  vp.video_index,
  vp.video_id,
  vp.playlist_id,
  g.game_date,
  g.home_team_name,
  g.away_team_name
FROM video_projects vp
JOIN games g ON vp.TSV_game_number = g.TSV_game_number
WHERE vp.TSV_game_number IS NOT NULL
ORDER BY vp.TSV_game_number, vp.video_index;
