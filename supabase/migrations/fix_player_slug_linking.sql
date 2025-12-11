-- Fix player_slug linking for existing box_scores data
-- This will populate player_slug for TSV Neuenstadt players

-- Check current linking status
SELECT 
  'Total box_scores' as status,
  COUNT(*) as count
FROM box_scores
UNION ALL
SELECT 
  'With player_slug' as status,
  COUNT(*) as count
FROM box_scores 
WHERE player_slug IS NOT NULL
UNION ALL
SELECT 
  'TSV Neuenstadt players' as status,
  COUNT(*) as count
FROM box_scores 
WHERE team_id = '168416';

-- Update player_slug for existing TSV Neuenstadt boxscores
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
  AND player_slug IS NULL;

-- Show sample of updated data
SELECT 
  player_first_name,
  player_last_name,
  player_slug,
  points,
  team_id
FROM box_scores 
WHERE team_id = '168416' 
  AND player_slug IS NOT NULL
LIMIT 10;

-- Check if views now have data
SELECT 'player_season_totals count' as view_name, COUNT(*) as count FROM player_season_totals
UNION ALL
SELECT 'player_game_logs count' as view_name, COUNT(*) as count FROM player_game_logs;
