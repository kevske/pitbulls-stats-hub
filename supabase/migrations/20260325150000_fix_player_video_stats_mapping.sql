-- Add missing players to player_info
INSERT INTO public.player_info (player_slug, first_name, last_name, jersey_number, is_active)
VALUES 
  ('tobi-thury', 'Tobi', 'Thury', 52, true),
  ('markus-maurer', 'Markus', 'Maurer', NULL, true)
ON CONFLICT (player_slug) DO UPDATE 
SET 
  jersey_number = COALESCE(player_info.jersey_number, EXCLUDED.jersey_number),
  is_active = true;

-- Update jersey numbers for existing players to improve future mapping
UPDATE public.player_info SET jersey_number = 19 WHERE player_slug = 'kevin-rassner' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 30 WHERE player_slug = 'stefan-anselm' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 77 WHERE player_slug = 'gregor-arapidis' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 55 WHERE player_slug = 'abdullah-ari' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 17 WHERE player_slug = 'sven-bader' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 21 WHERE player_slug = 'jan-crocoll' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 7 WHERE player_slug = 'nino-de-bortoli' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 33 WHERE player_slug = 'marcus-hayes' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 13 WHERE player_slug = 'tim-krause' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 41 WHERE player_slug = 'christoph-mrsch' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 11 WHERE player_slug = 'alexander-rib' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 69 WHERE player_slug = 'david-scheja' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 24 WHERE player_slug = 'marius-scholl' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 8 WHERE player_slug = 'jan-strobel' AND jersey_number IS NULL;
UPDATE public.player_info SET jersey_number = 31 WHERE player_slug = 'danny-seitz' AND jersey_number IS NULL;

-- Function to safely merge stats from a temporary ID to a permanent slug
CREATE OR REPLACE FUNCTION public.safely_map_video_player(old_id TEXT, new_slug TEXT)
RETURNS void AS $$
BEGIN
    -- 1. Merge stats for games where both IDs exist
    UPDATE public.player_video_stats t
    SET 
        two_pointers_made = t.two_pointers_made + s.two_pointers_made,
        two_pointers_attempted = t.two_pointers_attempted + s.two_pointers_attempted,
        three_pointers_made = t.three_pointers_made + s.three_pointers_made,
        three_pointers_attempted = t.three_pointers_attempted + s.three_pointers_attempted,
        free_throws_made = COALESCE(t.free_throws_made, 0) + COALESCE(s.free_throws_made, 0),
        free_throws_attempted = COALESCE(t.free_throws_attempted, 0) + COALESCE(s.free_throws_attempted, 0),
        fouls = COALESCE(t.fouls, 0) + COALESCE(s.fouls, 0),
        total_points = COALESCE(t.total_points, 0) + COALESCE(s.total_points, 0),
        steals = COALESCE(t.steals, 0) + COALESCE(s.steals, 0),
        blocks = COALESCE(t.blocks, 0) + COALESCE(s.blocks, 0),
        assists = COALESCE(t.assists, 0) + COALESCE(s.assists, 0),
        rebounds = COALESCE(t.rebounds, 0) + COALESCE(s.rebounds, 0),
        turnovers = COALESCE(t.turnovers, 0) + COALESCE(s.turnovers, 0)
    FROM public.player_video_stats s
    WHERE t.player_id = new_slug AND s.player_id = old_id AND t.game_number = s.game_number;

    -- 2. Delete the old rows that were just merged
    DELETE FROM public.player_video_stats 
    WHERE player_id = old_id 
    AND game_number IN (SELECT game_number FROM public.player_video_stats WHERE player_id = new_slug);

    -- 3. Rename any remaining old rows (where the new slug didn't exist for that game)
    UPDATE public.player_video_stats SET player_id = new_slug WHERE player_id = old_id;
END;
$$ LANGUAGE plpgsql;

-- Perform safe mapping for all suspected numerical artefacts
SELECT public.safely_map_video_player('1', 'kevin-rassner');
SELECT public.safely_map_video_player('2', 'stefan-anselm');
SELECT public.safely_map_video_player('3', 'gregor-arapidis');
SELECT public.safely_map_video_player('4', 'abdullah-ari');
SELECT public.safely_map_video_player('5', 'sven-bader');
SELECT public.safely_map_video_player('6', 'jan-crocoll');
SELECT public.safely_map_video_player('7', 'nino-de-bortoli');
SELECT public.safely_map_video_player('8', 'marcus-hayes');
SELECT public.safely_map_video_player('9', 'tim-krause');
SELECT public.safely_map_video_player('10', 'christoph-mrsch');
SELECT public.safely_map_video_player('11', 'alexander-rib');
SELECT public.safely_map_video_player('12', 'david-scheja');
SELECT public.safely_map_video_player('13', 'marius-scholl');
SELECT public.safely_map_video_player('14', 'jan-strobel');
SELECT public.safely_map_video_player('15', 'tobi-thury');
SELECT public.safely_map_video_player('16', 'danny-seitz');

-- Clean up the temporary function
DROP FUNCTION public.safely_map_video_player(TEXT, TEXT);
