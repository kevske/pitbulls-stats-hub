-- Remove redundant game_number column from video_projects table
-- Run this only after confirming TSV_game_number is working correctly

-- Step 1: Drop the old unique constraint on game_number, video_index
ALTER TABLE video_projects 
DROP CONSTRAINT IF EXISTS video_projects_game_number_video_index_unique;

-- Step 2: Drop the old game_number column
ALTER TABLE video_projects 
DROP COLUMN IF EXISTS game_number;

-- Step 3: Verify the final table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'video_projects' 
ORDER BY ordinal_position;

-- Step 4: Verify data integrity after cleanup
SELECT 
  vp.tsv_game_number,
  vp.video_index,
  vp.video_id,
  vp.playlist_id,
  g.game_date,
  g.home_team_name,
  g.away_team_name
FROM video_projects vp
JOIN games g ON vp.tsv_game_number = g.TSV_game_number
ORDER BY vp.tsv_game_number, vp.video_index;
