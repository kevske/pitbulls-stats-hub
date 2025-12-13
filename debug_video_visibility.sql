-- Debug script to check video_projects table structure and data
-- Run this to understand why videos are not showing

-- Step 1: Check video_projects table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'video_projects' 
ORDER BY ordinal_position;

-- Step 2: Check if TSV_game_number column exists and has data
SELECT 
  COUNT(*) as total_rows,
  COUNT(tsv_game_number) as rows_with_tsv_game_number,
  COUNT(game_number) as rows_with_game_number
FROM video_projects;

-- Step 3: Show sample data from video_projects
SELECT 
  id,
  tsv_game_number,
  game_number,
  video_index,
  video_id,
  playlist_id,
  created_at
FROM video_projects 
ORDER BY id
LIMIT 10;

-- Step 4: Check games table TSV_game_number
SELECT 
  COUNT(*) as total_games,
  COUNT(TSV_game_number) as games_with_tsv_number,
  MIN(TSV_game_number) as min_tsv,
  MAX(TSV_game_number) as max_tsv
FROM games 
WHERE (
  LOWER(home_team_name) LIKE '%neuenstadt%' OR 
  LOWER(away_team_name) LIKE '%neuenstadt%' OR
  LOWER(home_team_name) LIKE '%pitbull%' OR 
  LOWER(away_team_name) LIKE '%pitbull%'
);

-- Step 5: Check if there are any matching records
SELECT 
  COUNT(*) as matching_records
FROM video_projects vp
JOIN games g ON vp.tsv_game_number = g.TSV_game_number
WHERE g.TSV_game_number IS NOT NULL;
