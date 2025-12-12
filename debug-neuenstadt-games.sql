-- SQL Query to check box scores for all TSV Neuenstadt games
-- Run this in the Supabase SQL Editor

-- First, let's see all TSV Neuenstadt games
SELECT 
    g.game_id,
    g.home_team_name,
    g.away_team_name,
    g.game_date,
    g.home_team_id,
    g.away_team_id,
    g.status
FROM games g
WHERE g.home_team_name ILIKE '%neuenstadt%' 
   OR g.away_team_name ILIKE '%neuenstadt%'
ORDER BY g.game_date DESC;

-- Now, let's see which of these games have box scores
SELECT 
    g.game_id,
    g.home_team_name,
    g.away_team_name,
    g.game_date,
    COUNT(bs.id) as boxscore_count,
    COUNT(DISTINCT bs.player_slug) as players_with_slug,
    COUNT(DISTINCT CASE WHEN bs.player_slug IS NOT NULL THEN bs.player_slug END) as valid_players
FROM games g
LEFT JOIN box_scores bs ON g.game_id = bs.game_id
WHERE g.home_team_name ILIKE '%neuenstadt%' 
   OR g.away_team_name ILIKE '%neuenstadt%'
GROUP BY g.game_id, g.home_team_name, g.away_team_name, g.game_date
ORDER BY g.game_date DESC;

-- Let's specifically check game 2786687 (the working example)
SELECT 
    g.game_id,
    g.home_team_name,
    g.away_team_name,
    g.game_date,
    g.home_team_id,
    g.away_team_id,
    bs.player_first_name,
    bs.player_last_name,
    bs.player_slug,
    bs.team_id,
    bs.points,
    bs.minutes_played
FROM games g
LEFT JOIN box_scores bs ON g.game_id = bs.game_id
WHERE g.game_id = '2786687';

-- Check which team_id represents TSV Neuenstadt in game 2786687
SELECT 
    g.game_id,
    g.home_team_name,
    g.away_team_name,
    CASE 
        WHEN g.home_team_name ILIKE '%neuenstadt%' THEN g.home_team_id
        WHEN g.away_team_name ILIKE '%neuenstadt%' THEN g.away_team_id
        ELSE NULL
    END as tsv_neuenstadt_team_id
FROM games g
WHERE g.game_id = '2786687';

-- Check all box scores for game 2786687 with team info
SELECT 
    bs.game_id,
    bs.player_first_name,
    bs.player_last_name,
    bs.player_slug,
    bs.team_id,
    bs.points,
    bs.minutes_played,
    CASE 
        WHEN g.home_team_name ILIKE '%neuenstadt%' AND bs.team_id = g.home_team_id THEN 'TSV Neuenstadt Player'
        WHEN g.away_team_name ILIKE '%neuenstadt%' AND bs.team_id = g.away_team_id THEN 'TSV Neuenstadt Player'
        ELSE 'Opponent Player'
    END as player_type
FROM box_scores bs
JOIN games g ON bs.game_id = g.game_id
WHERE bs.game_id = '2786687'
ORDER BY bs.points DESC;
