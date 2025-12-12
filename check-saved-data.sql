-- Check the actual data in the database for game 2786716
SELECT 
    game_id,
    player_slug,
    player_first_name,
    player_last_name,
    minutes_played,
    points
FROM box_scores 
WHERE game_id = '2786716' 
    AND player_slug = 'stefan-anselm'
ORDER BY player_last_name;
