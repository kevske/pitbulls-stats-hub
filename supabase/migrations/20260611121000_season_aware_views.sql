-- ============================================================================
-- Season-aware views
--
-- player_season_totals und player_game_logs aggregierten bisher über ALLE
-- Box-Scores eines Spielers — mit Beginn der Saison 2026/27 hätten sich
-- die Statistiken beider Saisons vermischt. Beide Views führen jetzt
-- season_id; das Frontend filtert auf die gewählte Saison.
--
-- Außerdem: Die Erkennung "ist das unser Team?" lief über hardcodierte
-- ILIKE-Muster und die fest verdrahtete team_id '168416'. Primärquelle ist
-- jetzt seasons.our_team_id (pro Saison), die Namensmuster bleiben nur als
-- Fallback für Alt-Daten ohne our_team_id.
-- ============================================================================

-- Hilfsfunktion: zentrale Definition von "unser Team" für SQL
CREATE OR REPLACE FUNCTION is_our_team(p_team_id TEXT, p_team_name TEXT, p_season_id BIGINT)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT s.our_team_id IS NOT NULL AND s.our_team_id = p_team_id
     FROM seasons s WHERE s.id = p_season_id AND s.our_team_id IS NOT NULL),
    p_team_name ILIKE '%neuenstadt%' OR p_team_name ILIKE '%pitbull%'
  );
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION is_our_team IS 'Zentrale Team-Erkennung: our_team_id der Saison, Fallback auf Namensmuster für Alt-Daten.';

-- Views müssen wegen neuer Spalten neu erstellt werden
DROP FUNCTION IF EXISTS get_player_stats(TEXT);
DROP FUNCTION IF EXISTS get_all_player_stats();
DROP VIEW IF EXISTS player_game_logs;
DROP VIEW IF EXISTS player_season_totals;

-- ----------------------------------------------------------------------------
-- player_game_logs (+ season_id, + game_date für korrekte Sortierung)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW player_game_logs AS
SELECT
  g.season_id,
  COALESCE(pi.player_slug, bs.player_slug, LOWER(REGEXP_REPLACE(bs.player_first_name || '-' || bs.player_last_name, '[^a-zA-Z\s-]', '', 'g'))) as player_slug,
  COALESCE(pi.first_name, bs.player_first_name) as first_name,
  COALESCE(pi.last_name, bs.player_last_name) as last_name,
  bs.game_id,
  g.game_date,
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
    WHEN is_our_team(bs.team_id, g.home_team_name, g.season_id) AND bs.team_id = g.home_team_id THEN 'Heim'
    ELSE 'Auswärts'
  END as game_type
FROM box_scores bs
JOIN games g ON bs.game_id = g.game_id
LEFT JOIN player_info pi ON
  bs.player_slug = pi.player_slug OR
  (LOWER(pi.first_name) = LOWER(bs.player_first_name) AND LOWER(pi.last_name) = LOWER(bs.player_last_name))
WHERE (bs.team_id = g.home_team_id AND is_our_team(g.home_team_id, g.home_team_name, g.season_id))
   OR (bs.team_id = g.away_team_id AND is_our_team(g.away_team_id, g.away_team_name, g.season_id))
ORDER BY COALESCE(pi.last_name, bs.player_last_name), COALESCE(pi.first_name, bs.player_first_name), bs.game_id;

-- ----------------------------------------------------------------------------
-- player_season_totals (+ season_id in Spalten UND Gruppierung)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW player_season_totals AS
SELECT
  g.season_id,
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
JOIN games g ON bs.game_id = g.game_id
LEFT JOIN player_info pi ON
  bs.player_slug = pi.player_slug OR
  (LOWER(pi.first_name) = LOWER(bs.player_first_name) AND LOWER(pi.last_name) = LOWER(bs.player_last_name))
WHERE (bs.team_id = g.home_team_id AND is_our_team(g.home_team_id, g.home_team_name, g.season_id))
   OR (bs.team_id = g.away_team_id AND is_our_team(g.away_team_id, g.away_team_name, g.season_id))
GROUP BY
  g.season_id,
  COALESCE(pi.player_slug, bs.player_slug, LOWER(REGEXP_REPLACE(bs.player_first_name || '-' || bs.player_last_name, '[^a-zA-Z\s-]', '', 'g'))),
  COALESCE(pi.first_name, bs.player_first_name),
  COALESCE(pi.last_name, bs.player_last_name)
ORDER BY last_name, first_name;

-- ----------------------------------------------------------------------------
-- Funktionen mit Saison-Parameter neu aufbauen (Default: aktuelle Saison)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_player_stats(player_slug_param TEXT, season_id_param BIGINT DEFAULT NULL)
RETURNS SETOF player_season_totals AS $$
  SELECT * FROM player_season_totals
  WHERE player_slug = player_slug_param
    AND season_id = COALESCE(season_id_param, (SELECT id FROM seasons WHERE is_current));
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_all_player_stats(season_id_param BIGINT DEFAULT NULL)
RETURNS SETOF player_season_totals AS $$
  SELECT * FROM player_season_totals
  WHERE season_id = COALESCE(season_id_param, (SELECT id FROM seasons WHERE is_current))
  ORDER BY points_per_game DESC;
$$ LANGUAGE sql STABLE;

COMMENT ON VIEW player_season_totals IS 'Aggregierte Statistiken pro Spieler UND Saison. Ohne season_id-Filter liefert die View eine Zeile je Spieler je Saison.';
COMMENT ON VIEW player_game_logs IS 'Per-Game-Statistiken aller Pitbulls-Spieler, saisonfähig über season_id.';
