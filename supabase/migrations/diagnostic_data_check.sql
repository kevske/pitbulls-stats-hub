-- Diagnostic queries to check data flow and identify why stats are empty

-- Check 1: Do we have player_info data?
SELECT 'player_info count' as table_name, COUNT(*) as record_count FROM player_info
UNION ALL
SELECT 'active players' as table_name, COUNT(*) as record_count FROM player_info WHERE is_active = true
UNION ALL  
SELECT 'box_scores count' as table_name, COUNT(*) as record_count FROM box_scores
UNION ALL
SELECT 'box_scores with player_slug' as table_name, COUNT(*) as record_count FROM box_scores WHERE player_slug IS NOT NULL
UNION ALL
SELECT 'box_scores with minutes > 0' as table_name, COUNT(*) as record_count FROM box_scores WHERE minutes_played > 0;

-- Check 2: Sample player_info data
SELECT player_slug, first_name, last_name, is_active FROM player_info ORDER BY last_name, first_name LIMIT 5;

-- Check 3: Sample box_scores data (if any)
SELECT game_id, player_first_name, player_last_name, player_slug, points, minutes_played FROM box_scores LIMIT 5;

-- Check 4: What the player_season_totals view actually returns
SELECT player_slug, first_name, last_name, games_played, points_per_game FROM player_season_totals LIMIT 5;

-- Check 5: Players that should have stats but don't (players in player_info but no matching boxscores)
SELECT 
  pi.player_slug, 
  pi.first_name, 
  pi.last_name,
  'No boxscore data found' as issue
FROM player_info pi
LEFT JOIN box_scores bs ON pi.player_slug = bs.player_slug
WHERE pi.is_active = true 
  AND bs.player_slug IS NULL
ORDER BY pi.last_name, pi.first_name;
