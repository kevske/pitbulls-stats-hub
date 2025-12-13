-- Migration to fix gameType calculation based on home/away team information
-- This replaces the existing player_game_logs view to properly determine if a game is home or away

-- Drop existing view
DROP VIEW IF EXISTS player_game_logs CASCADE;

-- Create a new view that properly calculates gameType
CREATE OR REPLACE VIEW player_game_logs AS
SELECT 
    pi.player_slug,
    pi.first_name,
    pi.last_name,
    bs.game_id,
    bs.minutes_played,
    bs.points,
    bs.two_pointers,
    bs.three_pointers,
    bs.free_throws_made,
    bs.free_throw_attempts,
    CASE 
        WHEN bs.free_throw_attempts > 0 
        THEN ROUND((bs.free_throws_made * 100.0 / bs.free_throw_attempts), 1) || '%'
        ELSE '0%'
    END as free_throw_percentage,
    bs.fouls,
    CASE 
        WHEN bs.minutes_played > 0 
        THEN ROUND((bs.points * 40.0 / bs.minutes_played), 1)
        ELSE 0
    END as points_per_40,
    CASE 
        WHEN bs.minutes_played > 0 
        THEN ROUND((bs.free_throw_attempts * 40.0 / bs.minutes_played), 1)
        ELSE 0
    END as free_throw_attempts_per_40,
    CASE 
        WHEN bs.minutes_played > 0 
        THEN ROUND((bs.fouls * 40.0 / bs.minutes_played), 1)
        ELSE 0
    END as fouls_per_40,
    CASE 
        WHEN bs.minutes_played > 0 
        THEN ROUND((bs.three_pointers * 40.0 / bs.minutes_played), 1)
        ELSE 0
    END as three_pointers_per_40,
    -- Properly calculate gameType based on whether Pitbulls/Neuenstadt is home or away
    CASE 
        WHEN g.home_team_name ILIKE '%neuenstadt%' OR g.home_team_name ILIKE '%pitbull%'
        THEN 'Heim'
        WHEN g.away_team_name ILIKE '%neuenstadt%' OR g.away_team_name ILIKE '%pitbull%'
        THEN 'Auswärts'
        ELSE 'Unbekannt'
    END as game_type
FROM player_info pi
INNER JOIN box_scores bs ON pi.player_slug = bs.player_slug
INNER JOIN games g ON bs.game_id = g.game_id
WHERE pi.is_active = true
ORDER BY pi.last_name, pi.first_name, bs.game_id;
