-- Debug script to check Spieltag mapping and Player Name matching

-- 1. Check the "Spieltag" mapping (Game Ordering)
SELECT 
    ROW_NUMBER() OVER (ORDER BY game_date ASC) as spieltag_number,
    game_id,
    game_date,
    home_team_name,
    away_team_name
FROM games 
WHERE home_team_name ILIKE '%neuenstadt%' 
   OR away_team_name ILIKE '%neuenstadt%'
ORDER BY game_date ASC;

-- 2. Check Player Names in Box Scores for a specific game (e.g., likely Spieltag 1 or 2)
-- Replace the game_id below with one found in the first query if needed, 
-- but let's just grab the first few box scores for context.
SELECT 
    g.game_date,
    bs.game_id,
    bs.player_first_name,
    bs.player_last_name,
    bs.player_slug
FROM box_scores bs
JOIN games g ON bs.game_id = g.game_id
WHERE (g.home_team_name ILIKE '%neuenstadt%' OR g.away_team_name ILIKE '%neuenstadt%')
ORDER BY g.game_date ASC, bs.player_last_name
LIMIT 20;
