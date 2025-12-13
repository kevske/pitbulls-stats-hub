-- Check what team names are actually stored in the games table
-- This will help identify why the Games page filtering isn't working

SELECT DISTINCT 
    home_team_name,
    away_team_name,
    CASE 
        WHEN home_team_name ILIKE '%neuenstadt%' OR home_team_name ILIKE '%pitbull%' THEN 'Home Team Match'
        WHEN away_team_name ILIKE '%neuenstadt%' OR away_team_name ILIKE '%pitbull%' THEN 'Away Team Match'
        ELSE 'No Match'
    END as match_status
FROM games
ORDER BY home_team_name, away_team_name;

-- Also check the exact team names that contain 'neuenstadt' or 'pitbull'
SELECT 
    game_id,
    game_date,
    home_team_name,
    away_team_name
FROM games
WHERE home_team_name ILIKE '%neuenstadt%' 
   OR away_team_name ILIKE '%neuenstadt%'
   OR home_team_name ILIKE '%pitbull%'
   OR away_team_name ILIKE '%pitbull%'
ORDER BY game_date;
