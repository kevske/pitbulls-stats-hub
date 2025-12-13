-- Debug the Supabase data mapping to understand why Games page shows no data
-- Check if the data structure matches what the frontend expects

-- 1. Check games table structure
SELECT 
    game_id,
    game_date,
    home_team_name,
    away_team_name,
    home_score,
    away_score,
    status,
    league_id,
    box_score_url
FROM games
WHERE home_team_name ILIKE '%neuenstadt%' OR away_team_name ILIKE '%neuenstadt%'
ORDER BY game_date
LIMIT 5;

-- 2. Check if player_season_totals view exists and has data
SELECT 
    COUNT(*) as total_players,
    COUNT(CASE WHEN points_per_game > 0 THEN 1 END) as players_with_points
FROM player_season_totals
LIMIT 1;

-- 3. Check if player_game_logs view exists and has data
SELECT 
    COUNT(*) as total_logs,
    COUNT(DISTINCT player_slug) as unique_players,
    COUNT(DISTINCT game_id) as unique_games
FROM player_game_logs
LIMIT 1;

-- 4. Sample player_game_logs data to see structure
SELECT 
    player_slug,
    game_id,
    points,
    minutes_played,
    three_pointers,
    free_throws_made,
    fouls
FROM player_game_logs
LIMIT 3;

-- 5. Check if views need to be recreated
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE viewname IN ('player_season_totals', 'player_game_logs');
