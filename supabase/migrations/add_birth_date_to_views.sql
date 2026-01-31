-- Migration: Add birth_date to player_season_totals view and related functions
-- FIXED: Drops objects first to avoid column mismatch errors

-- Step 1: Drop dependent functions first
DROP FUNCTION IF EXISTS get_player_stats(TEXT);
DROP FUNCTION IF EXISTS get_all_player_stats();

-- Step 2: Drop the view
DROP VIEW IF EXISTS player_season_totals;

-- Step 3: Re-create the view with birth_date
CREATE OR REPLACE VIEW player_season_totals AS
SELECT 
  pi.player_slug,
  pi.first_name,
  pi.last_name,
  pi.jersey_number,
  pi.position,
  pi.height,
  pi.bio,
  pi.birth_date, -- Added birth_date
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
WHERE pi.is_active = true
GROUP BY pi.player_slug, pi.first_name, pi.last_name, pi.jersey_number, pi.position, pi.height, pi.bio, pi.birth_date
ORDER BY pi.last_name, pi.first_name;

-- Step 4: Re-create get_player_stats function
CREATE OR REPLACE FUNCTION get_player_stats(player_slug_param TEXT)
RETURNS TABLE (
  player_slug TEXT,
  first_name TEXT,
  last_name TEXT,
  jersey_number INTEGER,
  player_position TEXT,
  height TEXT,
  bio TEXT,
  birth_date DATE, -- Added birth_date
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
    birth_date, 
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

-- Step 5: Re-create get_all_player_stats function
CREATE OR REPLACE FUNCTION get_all_player_stats()
RETURNS TABLE (
  player_slug TEXT,
  first_name TEXT,
  last_name TEXT,
  jersey_number INTEGER,
  player_position TEXT,
  height TEXT,
  bio TEXT,
  birth_date DATE, -- Added birth_date
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
    birth_date,
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

-- Apply comments again
COMMENT ON VIEW player_season_totals IS 'Aggregated season statistics for all active players, computed from boxscore data';
COMMENT ON FUNCTION get_player_stats IS 'Get complete statistics for a single player by their slug';
COMMENT ON FUNCTION get_all_player_stats IS 'Get all player statistics sorted by points per game';
