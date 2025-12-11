-- Filter out zero-value boxscores that drag down averages
-- This handles games with results but no actual boxscore data

-- Updated player_season_totals view with zero-value filtering
CREATE OR REPLACE VIEW player_season_totals AS
SELECT 
  pi.player_slug,
  pi.first_name,
  pi.last_name,
  pi.jersey_number,
  pi.position,
  pi.height,
  pi.bio,
  COUNT(DISTINCT bs.game_id) as games_played,
  COALESCE(AVG(bs.minutes_played), 0) as minutes_per_game,
  COALESCE(AVG(bs.points), 0) as points_per_game,
  COALESCE(AVG(bs.three_pointers), 0) as three_pointers_per_game,
  COALESCE(AVG(bs.fouls), 0) as fouls_per_game,
  COALESCE(AVG(bs.free_throws_made), 0) as free_throws_made_per_game,
  COALESCE(AVG(bs.free_throw_attempts), 0) as free_throw_attempts_per_game,
  CASE 
    WHEN COALESCE(SUM(bs.free_throw_attempts), 0) > 0 
    THEN ROUND((COALESCE(SUM(bs.free_throws_made), 0) * 100.0 / COALESCE(SUM(bs.free_throw_attempts), 0)), 1) || '%'
    ELSE '0%'
  END as free_throw_percentage,
  CASE 
    WHEN COALESCE(AVG(bs.minutes_played), 0) > 0 
    THEN ROUND((COALESCE(AVG(bs.points), 0) / COALESCE(AVG(bs.minutes_played), 0)) * 40, 1)
    ELSE 0
  END as points_per_40,
  CASE 
    WHEN COALESCE(AVG(bs.minutes_played), 0) > 0 
    THEN ROUND((COALESCE(AVG(bs.three_pointers), 0) / COALESCE(AVG(bs.minutes_played), 0)) * 40, 1)
    ELSE 0
  END as three_pointers_per_40,
  CASE 
    WHEN COALESCE(AVG(bs.minutes_played), 0) > 0 
    THEN ROUND((COALESCE(AVG(bs.fouls), 0) / COALESCE(AVG(bs.minutes_played), 0)) * 40, 1)
    ELSE 0
  END as fouls_per_40
FROM player_info pi
LEFT JOIN box_scores bs ON pi.player_slug = bs.player_slug
  AND (bs.points > 0 OR bs.points IS NULL)  -- Only exclude games where points = 0, keep NULL/positive
WHERE pi.is_active = true
GROUP BY pi.player_slug, pi.first_name, pi.last_name, pi.jersey_number, pi.position, pi.height, pi.bio
ORDER BY pi.last_name, pi.first_name;

-- Updated player_game_logs view with zero-value filtering
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
    THEN ROUND((bs.three_pointers * 40.0 / bs.minutes_played), 1)
    ELSE 0
  END as three_pointers_per_40,
  CASE 
    WHEN bs.minutes_played > 0 
    THEN ROUND((bs.fouls * 40.0 / bs.minutes_played), 1)
    ELSE 0
  END as fouls_per_40,
  'Heim' as game_type
FROM player_info pi
INNER JOIN box_scores bs ON pi.player_slug = bs.player_slug
WHERE pi.is_active = true
  AND (bs.points > 0 OR bs.points IS NULL)  -- Only exclude games where points = 0, keep NULL/positive
ORDER BY pi.last_name, pi.first_name, bs.game_id;

-- Create view to identify zero-value boxscores for debugging
CREATE OR REPLACE VIEW zero_value_boxscores AS
SELECT 
  game_id,
  player_first_name,
  player_last_name,
  player_slug,
  points,
  minutes_played,
  'Zero-value game' as issue
FROM box_scores 
WHERE points = 0 
ORDER BY game_id, player_last_name, player_first_name;
