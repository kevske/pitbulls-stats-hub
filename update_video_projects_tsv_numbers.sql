-- Update video_projects table to use TSV game numbering
-- This ensures perfect alignment between games and their videos

-- Step 1: Update video_projects game_number to match TSV_game_number from games table
UPDATE video_projects 
SET game_number = games.TSV_game_number::TEXT
FROM games
WHERE video_projects.game_number = games.game_id::TEXT
AND games.TSV_game_number IS NOT NULL
AND (
  LOWER(games.home_team_name) LIKE '%neuenstadt%' OR 
  LOWER(games.away_team_name) LIKE '%neuenstadt%' OR
  LOWER(games.home_team_name) LIKE '%pitbull%' OR 
  LOWER(games.away_team_name) LIKE '%pitbull%'
);

-- Step 2: Verify the updated video_projects
SELECT 
  vp.game_number,
  vp.video_id,
  vp.playlist_id,
  g.TSV_game_number,
  g.game_date,
  g.home_team_name,
  g.away_team_name
FROM video_projects vp
JOIN games g ON vp.game_number = g.TSV_game_number::TEXT
WHERE g.TSV_game_number IS NOT NULL
ORDER BY g.TSV_game_number, vp.video_index;
