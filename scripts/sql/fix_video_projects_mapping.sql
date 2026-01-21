-- Fix video_projects TSV migration to properly map existing data
-- This script cleans up the incorrect mapping and fixes duplicate entries

-- Step 1: Reset the TSV_game_number column (remove incorrect mappings)
UPDATE video_projects 
SET TSV_game_number = NULL;

-- Step 2: Properly map video projects to TSV game numbers
-- This assumes video_projects.game_number contains the TSV game number (not game_id)
UPDATE video_projects vp
SET TSV_game_number = 
  CASE 
    WHEN vp.game_number ~ '^[0-9]+$' THEN 
      CAST(vp.game_number AS INTEGER)
    ELSE NULL
  END
WHERE vp.game_number IS NOT NULL
AND vp.game_number ~ '^[0-9]+$' -- Only update if game_number is a valid number
AND EXISTS (
  SELECT 1 FROM games g 
  WHERE g.TSV_game_number = CAST(vp.game_number AS INTEGER)
);

-- Step 3: Check for any unmapped video projects that need manual attention
SELECT 
  'Unmapped Video Projects' as status,
  COUNT(*) as count
FROM video_projects vp
WHERE vp.TSV_game_number IS NULL
AND vp.game_number IS NOT NULL;

-- Step 4: Show sample of mapped vs unmapped
SELECT 
  vp.id,
  vp.game_number as original_game_number,
  vp.TSV_game_number as new_tsv_game_number,
  vp.video_index,
  vp.video_id,
  vp.playlist_id,
  CASE 
    WHEN vp.TSV_game_number IS NOT NULL THEN 'Mapped'
    ELSE 'Unmapped'
  END as mapping_status
FROM video_projects vp
ORDER BY vp.id
LIMIT 10;

-- Step 5: Verify no duplicates exist after mapping
SELECT 
  TSV_game_number,
  video_index,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::TEXT, ', ') as duplicate_ids
FROM video_projects 
WHERE TSV_game_number IS NOT NULL
GROUP BY TSV_game_number, video_index
HAVING COUNT(*) > 1;
