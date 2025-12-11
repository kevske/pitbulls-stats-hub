-- Create player stats views and functions for Supabase-based stats computation
-- This replaces the Google Sheets CSV-based system with real-time database calculations

-- Step 1: Create player season totals view
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
WHERE pi.is_active = true
GROUP BY pi.player_slug, pi.first_name, pi.last_name, pi.jersey_number, pi.position, pi.height, pi.bio
ORDER BY pi.last_name, pi.first_name;

-- Step 2: Create player game logs view (detailed per-game stats)
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
  -- Determine game type based on game data (this would need to be joined with games table)
  'Heim' as game_type -- Placeholder - should be determined from games table
FROM player_info pi
INNER JOIN box_scores bs ON pi.player_slug = bs.player_slug
WHERE pi.is_active = true
ORDER BY pi.last_name, pi.first_name, bs.game_id;

-- Step 3: Create function to get player stats by slug
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

-- Step 4: Create function to get all player stats (for API)
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

-- Step 5: Create indexes for performance on base tables only
CREATE INDEX IF NOT EXISTS idx_boxscores_player_slug_minutes ON box_scores(player_slug, minutes_played);
CREATE INDEX IF NOT EXISTS idx_boxscores_game_id_player ON box_scores(game_id, player_slug);
CREATE INDEX IF NOT EXISTS idx_player_info_active_players ON player_info(is_active, last_name, first_name);

-- Step 6: Add comments for documentation
COMMENT ON VIEW player_season_totals IS 'Aggregated season statistics for all active players, computed from boxscore data';
COMMENT ON VIEW player_game_logs IS 'Detailed per-game statistics for each player';
COMMENT ON FUNCTION get_player_stats IS 'Get complete statistics for a single player by their slug';
COMMENT ON FUNCTION get_all_player_stats IS 'Get all player statistics sorted by points per game';
