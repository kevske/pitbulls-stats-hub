-- Debug query to check what games data exists in the database
-- This will help identify why the games page shows no values

-- 1. Check if games table has data
SELECT 
    COUNT(*) as total_games,
    MIN(game_date) as earliest_game,
    MAX(game_date) as latest_game
FROM games;

-- 2. Check if games table has recent data 
-- 3. Check sample games data
SELECT 
    game_id,
    game_date,
    home_team_name,
    away_team_name,
    home_score,
    away_score,
    status,
    league_id
FROM games
ORDER BY game_date
LIMIT 10;

-- 4. Check if games involve TSV Neuenstadt
SELECT 
    game_id,
    game_date,
    home_team_name,
    away_team_name,
    home_score,
    away_score,
    CASE 
        WHEN home_team_name ILIKE '%neuenstadt%' OR away_team_name ILIKE '%neuenstadt%' 
        THEN 'Neuenstadt Game'
        ELSE 'Other Game'
    END as game_type
FROM games
ORDER BY game_date
LIMIT 20;

-- 5. Check player_season_totals view (used for player stats)
SELECT 
    COUNT(*) as total_players,
    COUNT(CASE WHEN points_per_game > 0 THEN 1 END) as players_with_points
FROM player_season_totals;

-- 6. Check player_game_logs view (used for game logs)
SELECT 
    COUNT(*) as total_game_logs,
    COUNT(DISTINCT player_slug) as unique_players,
    COUNT(DISTINCT game_id) as unique_games
FROM player_game_logs;

-- 7. Sample game logs to see if data structure matches
SELECT 
    player_slug,
    game_id,
    points,
    minutes_played,
    three_pointers
FROM player_game_logs
LIMIT 5;
