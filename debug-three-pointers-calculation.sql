-- Debug three-pointers calculation in player_season_totals view

-- 1. Check raw three_pointers data for a specific player
SELECT 
    bs.game_id,
    bs.player_slug,
    bs.player_first_name,
    bs.player_last_name,
    bs.three_pointers,
    bs.minutes_played,
    bs.points
FROM box_scores bs 
WHERE bs.player_slug = 'stefan-anselm'
ORDER BY bs.game_id;

-- 2. Check what the view calculates for this player
SELECT 
    pi.player_slug,
    pi.first_name,
    pi.last_name,
    COUNT(DISTINCT bs.game_id) as games_played,
    COUNT(*) as total_rows,
    COUNT(bs.three_pointers) as rows_with_three_data,
    COUNT(bs.three_pointers) FILTER (WHERE bs.three_pointers > 0) as rows_with_threes_made,
    SUM(bs.three_pointers) as total_three_pointers,
    AVG(bs.three_pointers) as avg_three_pointers_raw,
    COALESCE(AVG(bs.three_pointers), 0) as avg_three_pointers_coalesced,
    COALESCE(AVG(bs.minutes_played), 0) as avg_minutes_played
FROM player_info pi
LEFT JOIN box_scores bs ON pi.player_slug = bs.player_slug
WHERE pi.player_slug = 'stefan-anselm' AND pi.is_active = true
GROUP BY pi.player_slug, pi.first_name, pi.last_name;

-- 3. Compare with what the view actually returns
SELECT 
    player_slug,
    first_name,
    last_name,
    games_played,
    three_pointers_per_game,
    three_pointers_per_40
FROM player_season_totals 
WHERE player_slug = 'stefan-anselm';

-- 4. Check for players with NULL three_pointers but non-zero points
SELECT 
    pi.player_slug,
    pi.first_name,
    pi.last_name,
    COUNT(bs.game_id) as games_with_data,
    COUNT(bs.three_pointers) as games_with_three_data,
    COUNT(bs.three_pointers) FILTER (WHERE bs.three_pointers IS NULL) as games_with_null_threes,
    COUNT(bs.three_pointers) FILTER (WHERE bs.three_pointers > 0) as games_with_threes_made,
    SUM(bs.points) as total_points,
    SUM(bs.three_pointers) as total_threes
FROM player_info pi
LEFT JOIN box_scores bs ON pi.player_slug = bs.player_slug
WHERE pi.is_active = true
    AND bs.points > 0
GROUP BY pi.player_slug, pi.first_name, pi.last_name
HAVING COUNT(bs.three_pointers) FILTER (WHERE bs.three_pointers IS NULL) > 0
ORDER BY total_points DESC
LIMIT 10;
