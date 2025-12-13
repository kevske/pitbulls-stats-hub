-- Comprehensive check of three_pointers data in box_scores

-- 1. Overall three_pointers statistics
SELECT 
    COUNT(*) as total_boxscore_records,
    COUNT(*) FILTER (WHERE three_pointers IS NOT NULL) as records_with_three_pointers,
    COUNT(*) FILTER (WHERE three_pointers > 0) as records_with_threes_made,
    SUM(three_pointers) as total_three_pointers_made,
    MAX(three_pointers) as max_three_pointers_in_game,
    AVG(three_pointers) as avg_three_pointers_per_game
FROM box_scores;

-- 2. Check which players have three_pointers data
SELECT 
    player_slug,
    player_first_name,
    player_last_name,
    COUNT(*) as games_played,
    COUNT(*) FILTER (WHERE three_pointers IS NOT NULL) as games_with_three_data,
    COUNT(*) FILTER (WHERE three_pointers > 0) as games_with_threes_made,
    SUM(three_pointers) as total_threes,
    MAX(three_pointers) as best_game_threes
FROM box_scores 
WHERE player_slug IS NOT NULL
GROUP BY player_slug, player_first_name, player_last_name
ORDER BY total_threes DESC NULLS LAST
LIMIT 20;

-- 3. Check which games have three_pointers data
SELECT 
    game_id,
    COUNT(*) as total_players,
    COUNT(*) FILTER (WHERE three_pointers IS NOT NULL) as players_with_three_data,
    COUNT(*) FILTER (WHERE three_pointers > 0) as players_with_threes_made,
    SUM(three_pointers) as total_game_threes
FROM box_scores 
GROUP BY game_id
ORDER BY total_game_threes DESC NULLS LAST
LIMIT 20;

-- 4. Sample of records with three_pointers data
SELECT 
    game_id,
    player_slug,
    player_first_name,
    player_last_name,
    points,
    three_pointers,
    minutes_played
FROM box_scores 
WHERE three_pointers IS NOT NULL
ORDER BY three_pointers DESC
LIMIT 10;

-- 5. Sample of records where three_pointers is NULL but points > 0
SELECT 
    game_id,
    player_slug,
    player_first_name,
    player_last_name,
    points,
    three_pointers,
    minutes_played
FROM box_scores 
WHERE three_pointers IS NULL 
    AND points > 0
ORDER BY points DESC
LIMIT 10;
