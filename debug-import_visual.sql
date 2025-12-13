-- Debug script that RETURNS A RESULT TABLE so you can see the output clearly
-- (Look at the "Results" table, not just the messages)

WITH target_game AS (
    SELECT 
        game_id,
        game_date,
        home_team_name,
        away_team_name,
        ROW_NUMBER() OVER (ORDER BY game_date ASC) as rn
    FROM games 
    WHERE (home_team_name ILIKE '%neuenstadt%' OR away_team_name ILIKE '%neuenstadt%')
      AND game_date >= '2024-08-01'
    LIMIT 20 -- Look at first 20 games to find #2
)
SELECT 
    tg.rn as spieltag_number,
    tg.game_id,
    tg.game_date,
    bs.player_first_name,
    bs.player_last_name,
    bs.minutes_played as current_minutes,
    CASE 
        WHEN (bs.player_first_name || ' ' || bs.player_last_name) ILIKE '%Stefan Anselm%' THEN 'MATCH FOUND' 
        ELSE 'No Match' 
    END as debug_match_test
FROM target_game tg
LEFT JOIN box_scores bs ON tg.game_id = bs.game_id
WHERE tg.rn = 2 -- Focusing on Spieltag 2
ORDER BY bs.player_last_name;
