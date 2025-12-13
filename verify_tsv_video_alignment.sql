-- Comprehensive verification script for TSV game numbering and video alignment
-- Run this after both update scripts to verify everything is working correctly

-- Step 1: Verify TSV game numbering is correct
SELECT 
  'TSV Games' as table_name,
  TSV_game_number,
  game_date,
  home_team_name,
  away_team_name,
  home_score,
  away_score
FROM games 
WHERE TSV_game_number IS NOT NULL
ORDER BY TSV_game_number;

-- Step 2: Verify video_projects are using TSV game numbers
SELECT 
  'Video Projects' as table_name,
  vp.game_number,
  vp.video_index,
  vp.video_id,
  vp.playlist_id,
  g.TSV_game_number,
  g.game_date,
  g.home_team_name,
  g.away_team_name
FROM video_projects vp
LEFT JOIN games g ON vp.game_number = g.TSV_game_number::TEXT
ORDER BY COALESCE(g.TSV_game_number, 999999), vp.video_index;

-- Step 3: Verify video-to-game alignment (what the frontend will see)
SELECT 
  'Video Mapping Test' as table_name,
  g.TSV_game_number,
  g.game_date,
  g.home_team_name,
  g.away_team_name,
  COUNT(vp.video_id) as video_count,
  STRING_AGG(vp.video_id, ', ') as video_ids
FROM games g
LEFT JOIN video_projects vp ON g.TSV_game_number = vp.game_number::INTEGER
WHERE g.TSV_game_number IS NOT NULL
GROUP BY g.TSV_game_number, g.game_date, g.home_team_name, g.away_team_name
ORDER BY g.TSV_game_number;
