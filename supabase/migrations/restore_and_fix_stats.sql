-- Restore and Fix Player Stats Views
-- Use this script to restore the views dropped by 'fix-minutes-column-simple.sql'
-- and ensure player slugs are correctly linked.

-- 1. Fix missing slugs in box_scores (ensure data linkage)
UPDATE box_scores bs
SET player_slug = pi.player_slug
FROM player_info pi
WHERE 
  -- Match by name (case insensitive)
  (
    (bs.player_first_name || ' ' || bs.player_last_name) ILIKE (pi.first_name || ' ' || pi.last_name)
    OR
    -- Handle flipped names possibility
    (bs.player_last_name || ' ' || bs.player_first_name) ILIKE (pi.first_name || ' ' || pi.last_name)
  )
  -- Only update if slug is missing
  AND (bs.player_slug IS NULL OR bs.player_slug = '');

-- 2. Restore View: player_season_totals
-- Using SUM() / SUM() for more accurate per-40 calculations
DROP VIEW IF EXISTS player_season_totals CASCADE;

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
  ROUND(COALESCE(AVG(bs.minutes_played), 0), 1) as minutes_per_game,
  ROUND(COALESCE(AVG(bs.points), 0), 1) as points_per_game,
  ROUND(COALESCE(AVG(bs.three_pointers), 0), 1) as three_pointers_per_game,
  ROUND(COALESCE(AVG(bs.fouls), 0), 1) as fouls_per_game,
  ROUND(COALESCE(AVG(bs.free_throws_made), 0), 1) as free_throws_made_per_game,
  ROUND(COALESCE(AVG(bs.free_throw_attempts), 0), 1) as free_throw_attempts_per_game,
  CASE 
    WHEN COALESCE(SUM(bs.free_throw_attempts), 0) > 0 
    THEN ROUND((COALESCE(SUM(bs.free_throws_made), 0) * 100.0 / COALESCE(SUM(bs.free_throw_attempts), 0)), 1) || '%'
    ELSE '0%'
  END as free_throw_percentage,
  CASE 
    WHEN COALESCE(SUM(bs.minutes_played), 0) > 0 
    THEN ROUND((COALESCE(SUM(bs.points), 0) / COALESCE(SUM(bs.minutes_played), 0)) * 40, 1)
    ELSE 0
  END as points_per_40,
  CASE 
    WHEN COALESCE(SUM(bs.minutes_played), 0) > 0 
    THEN ROUND((COALESCE(SUM(bs.three_pointers), 0) / COALESCE(SUM(bs.minutes_played), 0)) * 40, 1)
    ELSE 0
  END as three_pointers_per_40,
  CASE 
    WHEN COALESCE(SUM(bs.minutes_played), 0) > 0 
    THEN ROUND((COALESCE(SUM(bs.fouls), 0) / COALESCE(SUM(bs.minutes_played), 0)) * 40, 1)
    ELSE 0
  END as fouls_per_40
FROM player_info pi
LEFT JOIN box_scores bs ON pi.player_slug = bs.player_slug AND bs.minutes_played > 0
WHERE pi.is_active = true
GROUP BY pi.player_slug, pi.first_name, pi.last_name, pi.jersey_number, pi.position, pi.height, pi.bio
ORDER BY pi.last_name, pi.first_name;

-- 3. Restore View: player_game_logs
DROP VIEW IF EXISTS player_game_logs CASCADE;

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
ORDER BY pi.last_name, pi.first_name, bs.game_id;

-- 4. Restore Functions (in case they were dropped or invalidated)
CREATE OR REPLACE FUNCTION get_player_stats(player_slug_param TEXT)
RETURNS TABLE (
  player_slug TEXT,
  first_name TEXT,
  last_name TEXT,
  jersey_number INTEGER,
  player_position TEXT,
  height TEXT,
  bio TEXT,
  games_played BIGINT,
  minutes_per_game NUMERIC,
  points_per_game NUMERIC,
  three_pointers_per_game NUMERIC,
  fouls_per_game NUMERIC,
  free_throws_made_per_game NUMERIC,
  free_throw_attempts_per_game NUMERIC,
  free_throw_percentage TEXT,
  points_per_40 NUMERIC,
  three_pointers_per_40 NUMERIC,
  fouls_per_40 NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    player_slug,
    first_name,
    last_name,
    jersey_number,
    position as player_position,
    height,
    bio,
    games_played,
    minutes_per_game,
    points_per_game,
    three_pointers_per_game,
    fouls_per_game,
    free_throws_made_per_game,
    free_throw_attempts_per_game,
    free_throw_percentage,
    points_per_40,
    three_pointers_per_40,
    fouls_per_40
  FROM player_season_totals 
  WHERE player_slug = player_slug_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_all_player_stats()
RETURNS TABLE (
  player_slug TEXT,
  first_name TEXT,
  last_name TEXT,
  jersey_number INTEGER,
  player_position TEXT,
  height TEXT,
  bio TEXT,
  games_played BIGINT,
  minutes_per_game NUMERIC,
  points_per_game NUMERIC,
  three_pointers_per_game NUMERIC,
  fouls_per_game NUMERIC,
  free_throws_made_per_game NUMERIC,
  free_throw_attempts_per_game NUMERIC,
  free_throw_percentage TEXT,
  points_per_40 NUMERIC,
  three_pointers_per_40 NUMERIC,
  fouls_per_40 NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    player_slug,
    first_name,
    last_name,
    jersey_number,
    position as player_position,
    height,
    bio,
    games_played,
    minutes_per_game,
    points_per_game,
    three_pointers_per_game,
    fouls_per_game,
    free_throws_made_per_game,
    free_throw_attempts_per_game,
    free_throw_percentage,
    points_per_40,
    three_pointers_per_40,
    fouls_per_40
  FROM player_season_totals
  ORDER BY points_per_game DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. Recreate Indexes (Optional, but good practice)
CREATE INDEX IF NOT EXISTS idx_boxscores_player_slug_minutes ON box_scores(player_slug, minutes_played);
