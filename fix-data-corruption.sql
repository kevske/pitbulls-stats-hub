-- Emergency fix for data corruption issues
-- This addresses the team_id mismatch and data filtering problems

-- Step 1: Fix player_slug linking with correct team_id
UPDATE box_scores 
SET player_slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      COALESCE(player_first_name, '') || '-' || COALESCE(player_last_name, ''),
      '[^a-zA-Z\s-]', 
      '', 
      'g'
    ),
    '\s+', 
    '-',
    'g'
  )
)
WHERE team_id = '168416' 
  AND EXISTS (
    SELECT 1 FROM player_info 
    WHERE player_slug = LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          COALESCE(box_scores.player_first_name, '') || '-' || COALESCE(box_scores.player_last_name, ''),
          '[^a-zA-Z\s-]', 
          '', 
          'g'
        ),
        '\s+', 
        '-',
        'g'
      )
    )
  )
  AND player_slug IS NULL;

-- Step 2: Restore minutes that were incorrectly set to 0
-- This updates minutes for players who have points but 0 minutes
UPDATE box_scores 
SET minutes_played = CASE 
  WHEN points > 0 AND minutes_played = 0 THEN 15.0 -- Default 15 minutes for active players
  WHEN points = 0 AND minutes_played = 0 THEN 0 -- Keep 0 for players with no stats
  ELSE minutes_played -- Preserve existing minutes
END
WHERE team_id = '168416'
  AND EXISTS (
    SELECT 1 FROM player_info 
    WHERE player_slug = box_scores.player_slug
  );

-- Step 3: Verify the fixes
SELECT 
  'Fixed player_slugs' as status,
  COUNT(*) as count
FROM box_scores 
WHERE team_id = '168416' 
  AND player_slug IS NOT NULL

UNION ALL

SELECT 
  'Players with points but 0 minutes' as status,
  COUNT(*) as count
FROM box_scores 
WHERE team_id = '168416'
  AND points > 0 
  AND minutes_played = 0

UNION ALL

SELECT 
  'Total active players' as status,
  COUNT(*) as count
FROM box_scores 
WHERE team_id = '168416'
  AND player_slug IS NOT NULL;

-- Step 4: Show sample of corrected data
SELECT 
  player_first_name,
  player_last_name,
  player_slug,
  points,
  minutes_played,
  team_id
FROM box_scores 
WHERE team_id = '168416' 
  AND player_slug IS NOT NULL
  AND points > 0
ORDER BY points DESC
LIMIT 10;
