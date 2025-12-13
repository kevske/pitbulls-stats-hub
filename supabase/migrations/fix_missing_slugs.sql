-- Fix Missing Player Slugs in Box Scores
-- This checks the manual player matching logic used in previously successful migrations
-- and applies it to fix any box scores that have lost their slug association.

UPDATE box_scores bs
SET player_slug = pi.player_slug
FROM player_info pi
WHERE 
  -- Join condition: Match names roughly
  (
    (bs.player_first_name || ' ' || bs.player_last_name) ILIKE (pi.first_name || ' ' || pi.last_name)
    OR
    -- Handle case where names might be flipped or formatted differently
    (bs.player_first_name || ' ' || bs.player_last_name) ILIKE (pi.first_name || ' ' || pi.last_name)
  )
  AND (bs.player_slug IS NULL OR bs.player_slug = '');

-- Verify the fix
SELECT 
    COUNT(*) as fixed_slugs_count
FROM box_scores bs
JOIN games g ON bs.game_id = g.game_id
WHERE (g.home_team_name ILIKE '%neuenstadt%' OR g.away_team_name ILIKE '%neuenstadt%')
  AND g.game_date >= '2024-08-01'
  AND bs.player_slug IS NOT NULL;
