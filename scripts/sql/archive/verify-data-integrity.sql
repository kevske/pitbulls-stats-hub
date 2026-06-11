-- Data integrity verification script
-- Run this after applying the fix-data-corruption.sql script

-- 1. Check player_slug linking integrity
SELECT 
  'Total TSV Neuenstadt box_scores' as category,
  COUNT(*) as count
FROM box_scores 
WHERE team_id = '168416'

UNION ALL

SELECT 
  'With player_slug linked' as category,
  COUNT(*) as count
FROM box_scores 
WHERE team_id = '168416' 
  AND player_slug IS NOT NULL

UNION ALL

SELECT 
  'Unmatched players (need manual linking)' as category,
  COUNT(*) as count
FROM box_scores 
WHERE team_id = '168416' 
  AND player_slug IS NULL

UNION ALL

SELECT 
  'Players in player_info table' as category,
  COUNT(*) as count
FROM player_info 
WHERE is_active = true;

-- 2. Check minutes data integrity
SELECT 
  'Players with points > 0' as category,
  COUNT(*) as count
FROM box_scores 
WHERE team_id = '168416' 
  AND points > 0

UNION ALL

SELECT 
  'Players with minutes > 0' as category,
  COUNT(*) as count
FROM box_scores 
WHERE team_id = '168416' 
  AND minutes_played > 0

UNION ALL

SELECT 
  'Players with points but 0 minutes (problematic)' as category,
  COUNT(*) as count
FROM box_scores 
WHERE team_id = '168416' 
  AND points > 0 
  AND minutes_played = 0

UNION ALL

SELECT 
  'Players with 0 points and 0 minutes (expected)' as category,
  COUNT(*) as count
FROM box_scores 
WHERE team_id = '168416' 
  AND points = 0 
  AND minutes_played = 0;

-- 3. Check view data consistency
SELECT 
  'player_season_totals view records' as category,
  COUNT(*) as count
FROM player_season_totals

UNION ALL

SELECT 
  'player_game_logs view records' as category,
  COUNT(*) as count
FROM player_game_logs

UNION ALL

SELECT 
  'player_stats_with_info view records' as category,
  COUNT(*) as count
FROM player_stats_with_info;

-- 4. Sample data verification
SELECT 
  g.game_date,
  bs.player_first_name,
  bs.player_last_name,
  bs.player_slug,
  bs.points,
  bs.minutes_played,
  CASE 
    WHEN bs.points > 0 AND bs.minutes_played = 0 THEN 'ERROR: Points but no minutes'
    WHEN bs.points = 0 AND bs.minutes_played > 0 THEN 'WARNING: Minutes but no points'
    WHEN bs.points > 0 AND bs.minutes_played > 0 THEN 'OK: Has stats'
    ELSE 'No stats recorded'
  END as data_status
FROM box_scores bs
JOIN games g ON bs.game_id = g.game_id
WHERE bs.team_id = '168416'
  AND g.game_date >= '2024-08-01'
ORDER BY g.game_date DESC, bs.points DESC
LIMIT 20;

-- 5. Check for duplicate or conflicting player_slug assignments
SELECT 
  player_slug,
  COUNT(*) as record_count,
  STRING_AGG(DISTINCT player_first_name || ' ' || player_last_name, ', ') as name_variations
FROM box_scores 
WHERE team_id = '168416' 
  AND player_slug IS NOT NULL
GROUP BY player_slug
HAVING COUNT(*) > 1
ORDER BY record_count DESC;
