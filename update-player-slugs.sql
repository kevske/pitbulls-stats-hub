-- Update player_slug field in box_scores table using firstName and lastName
-- Only for TSV Neuenstadt players and only if slug exists in player_info table
-- This will create slugs like 'abdullah-ari', 'jan-crocoll', etc.

UPDATE box_scores 
SET player_slug = LOWER(TRIM(BOTH ' ' FROM 
    REPLACE(
        REPLACE(
            COALESCE(player_first_name, '') || '-' || COALESCE(player_last_name, ''),
            ' ', '-'
        ),
        '--', '-'
    )
))
WHERE player_slug IS NULL 
AND (player_first_name IS NOT NULL AND player_last_name IS NOT NULL)
AND TRIM(COALESCE(player_first_name, '') || COALESCE(player_last_name, '')) != ''
AND EXISTS (
    SELECT 1 FROM games g 
    WHERE g.game_id = box_scores.game_id 
    AND (
        g.home_team_name ILIKE '%TSV Neuenstadt%' 
        OR g.away_team_name ILIKE '%TSV Neuenstadt%'
    )
)
AND EXISTS (
    SELECT 1 FROM player_info pi 
    WHERE pi.player_slug = LOWER(TRIM(BOTH ' ' FROM 
        REPLACE(
                REPLACE(
                    COALESCE(box_scores.player_first_name, '') || '-' || COALESCE(box_scores.player_last_name, ''),
                    ' ', '-'
                ),
                '--', '-'
            )
    ))
);

-- Show how many rows were updated
SELECT COUNT(*) as updated_rows 
FROM box_scores 
WHERE player_slug IS NOT NULL 
AND (player_first_name IS NOT NULL AND player_last_name IS NOT NULL)
AND EXISTS (
    SELECT 1 FROM games g 
    WHERE g.game_id = box_scores.game_id 
    AND (
        g.home_team_name ILIKE '%TSV Neuenstadt%' 
        OR g.away_team_name ILIKE '%TSV Neuenstadt%'
    )
);

-- Show sample of updated data
SELECT game_id, player_first_name, player_last_name, player_slug 
FROM box_scores 
WHERE player_slug IS NOT NULL 
AND (player_first_name IS NOT NULL AND player_last_name IS NOT NULL)
AND EXISTS (
    SELECT 1 FROM games g 
    WHERE g.game_id = box_scores.game_id 
    AND (
        g.home_team_name ILIKE '%TSV Neuenstadt%' 
        OR g.away_team_name ILIKE '%TSV Neuenstadt%'
    )
)
LIMIT 10;
