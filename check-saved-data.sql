-- Check the actual data in the database for game 2786716
SELECT 
    game_id,
    player_slug,
    player_first_name,
    player_last_name,
    minutes_played,
    points,
    three_pointers
FROM box_scores 
WHERE game_id = '2786716' 
    AND player_slug = 'stefan-anselm'
ORDER BY player_last_name;

-- Check three_pointers data across all games for this player
SELECT 
    game_id,
    player_first_name,
    player_last_name,
    points,
    three_pointers,
    minutes_played
FROM box_scores 
WHERE player_slug = 'stefan-anselm'
    AND three_pointers IS NOT NULL
ORDER BY game_id;
