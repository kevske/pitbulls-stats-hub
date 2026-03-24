-- Architectural fix for missing top scorers in Games.tsx
-- The problem: player_game_logs was using an INNER JOIN with player_info.
-- This caused any player who played in a game but didn't have an exact matching player_slug
-- in player_info (or wasn't manually added to the active roster yet) to completely
-- disappear from the game logs, causing them to not show up as Top Scorers.

-- Step 0: Ensure all box_scores records belonging to TSV Neuenstadt naturally have a mapped player_slug.
UPDATE box_scores bs
SET player_slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(bs.player_first_name, '') || '-' || COALESCE(bs.player_last_name, ''), '[^a-zA-Z\s-]', '', 'g'), '\s+', '-', 'g'))
FROM games g
WHERE bs.game_id = g.game_id
  AND (
    (bs.team_id = g.home_team_id AND (g.home_team_name ILIKE '%neuenstadt%' OR g.home_team_name ILIKE '%pitbulls%')) OR
    (bs.team_id = g.away_team_id AND (g.away_team_name ILIKE '%neuenstadt%' OR g.away_team_name ILIKE '%pitbulls%'))
  )
  AND bs.player_slug IS NULL;

-- Step 1: Drop dependent functions and views first to avoid type/column mismatch errors
DROP FUNCTION IF EXISTS get_player_stats(TEXT);
DROP FUNCTION IF EXISTS get_all_player_stats();
DROP VIEW IF EXISTS player_game_logs;
DROP VIEW IF EXISTS player_season_totals;

-- Step 2: Create a vastly improved player_game_logs view
-- This view uses ALL box_scores for TSV Neuenstadt and LEFT JOINs player_info.
-- This ensures NO ONE is silently dropped from game top scorers just because their bio isn't fully set up.
CREATE OR REPLACE VIEW player_game_logs AS
SELECT 
  COALESCE(pi.player_slug, bs.player_slug, LOWER(REGEXP_REPLACE(bs.player_first_name || '-' || bs.player_last_name, '[^a-zA-Z\s-]', '', 'g'))) as player_slug,
  COALESCE(pi.first_name, bs.player_first_name) as first_name,
  COALESCE(pi.last_name, bs.player_last_name) as last_name,
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
  CASE 
    WHEN (g.home_team_name ILIKE '%neuenstadt%' OR g.home_team_name ILIKE '%pitbulls%') AND bs.team_id = g.home_team_id THEN 'Heim'
    ELSE 'Auswärts' 
  END as game_type
FROM box_scores bs
JOIN games g ON bs.game_id = g.game_id
LEFT JOIN player_info pi ON 
  bs.player_slug = pi.player_slug OR 
  (LOWER(pi.first_name) = LOWER(bs.player_first_name) AND LOWER(pi.last_name) = LOWER(bs.player_last_name))
WHERE (g.home_team_name ILIKE '%neuenstadt%' OR g.home_team_name ILIKE '%pitbulls%') AND bs.team_id = g.home_team_id
   OR (g.away_team_name ILIKE '%neuenstadt%' OR g.away_team_name ILIKE '%pitbulls%') AND bs.team_id = g.away_team_id
   OR bs.team_id = '168416'
ORDER BY COALESCE(pi.last_name, bs.player_last_name), COALESCE(pi.first_name, bs.player_first_name), bs.game_id;

-- Step 3: Modify player_season_totals so that these 'ghost' players also get a basic context in the frontend
-- This prevents the 'Unbekannt' rendering for unknown players in Games.tsx Top Scorers.
CREATE OR REPLACE VIEW player_season_totals AS
SELECT 
  COALESCE(pi.player_slug, bs.player_slug, LOWER(REGEXP_REPLACE(bs.player_first_name || '-' || bs.player_last_name, '[^a-zA-Z\s-]', '', 'g'))) as player_slug,
  COALESCE(pi.first_name, bs.player_first_name) as first_name,
  COALESCE(pi.last_name, bs.player_last_name) as last_name,
  MAX(pi.jersey_number) as jersey_number,
  MAX(pi.position) as position,
  MAX(pi.height) as height,
  MAX(pi.bio) as bio,
  MAX(pi.birth_date) as birth_date,
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
FROM box_scores bs
LEFT JOIN games g ON bs.game_id = g.game_id
LEFT JOIN player_info pi ON 
  bs.player_slug = pi.player_slug OR 
  (LOWER(pi.first_name) = LOWER(bs.player_first_name) AND LOWER(pi.last_name) = LOWER(bs.player_last_name))
WHERE (g.home_team_name ILIKE '%neuenstadt%' OR g.home_team_name ILIKE '%pitbulls%') AND bs.team_id = g.home_team_id
   OR (g.away_team_name ILIKE '%neuenstadt%' OR g.away_team_name ILIKE '%pitbulls%') AND bs.team_id = g.away_team_id
   OR bs.team_id = '168416'
GROUP BY 
  COALESCE(pi.player_slug, bs.player_slug, LOWER(REGEXP_REPLACE(bs.player_first_name || '-' || bs.player_last_name, '[^a-zA-Z\s-]', '', 'g'))),
  COALESCE(pi.first_name, bs.player_first_name),
  COALESCE(pi.last_name, bs.player_last_name)
ORDER BY last_name, first_name;

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
  birth_date DATE,
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
  SELECT * FROM player_season_totals 
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
  birth_date DATE,
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
  SELECT * FROM player_season_totals
  ORDER BY points_per_game DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Trigger to ensure future box scores for ALL TSV games automatically get a slug if missing
CREATE OR REPLACE FUNCTION generate_box_score_player_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.player_slug IS NULL THEN
    NEW.player_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(NEW.player_first_name, '') || '-' || COALESCE(NEW.player_last_name, ''), '[^a-zA-Z\s-]', '', 'g'), '\s+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_box_score_player_slug ON box_scores;

CREATE TRIGGER trg_generate_box_score_player_slug
BEFORE INSERT OR UPDATE ON box_scores
FOR EACH ROW
EXECUTE FUNCTION generate_box_score_player_slug();
