-- REVERT the incorrect migration 20260324120000_fix_retrospective_stats.sql
-- 
-- That migration wrongly assumed free throws were included in two_pointers_made/attempted,
-- but the extraction code (statsExtraction.ts) already correctly separates FTs from FGs:
--   - points===1 → freeThrows only (NOT fieldGoals)
--   - points===2 → fieldGoals + twoPointers
--   - points===3 → fieldGoals + threePointers
-- 
-- The mapping in useVideoStatsIntegration.ts computes:
--   twoPointersMade = fieldGoalsMade - threePointersMade  (correct, FTs not included)
--
-- The bad migration subtracted free throws from already-correct two-pointer values.
-- This migration restores the correct values by adding them back.

UPDATE public.player_video_stats
SET 
  two_pointers_made = two_pointers_made + free_throws_made,
  two_pointers_attempted = two_pointers_attempted + free_throws_attempted
WHERE free_throws_attempted > 0;

-- Recalculate team FG percentage based on corrected player stats
UPDATE public.video_game_stats vgs
SET team_fg_percentage = 
  CASE 
    WHEN (
      SELECT SUM(pvs.two_pointers_attempted + pvs.three_pointers_attempted) 
      FROM public.player_video_stats pvs 
      WHERE pvs.game_number = vgs.game_number
    ) > 0 
    THEN 
      ROUND((
        SELECT SUM(pvs.two_pointers_made + pvs.three_pointers_made)::numeric / 
               SUM(pvs.two_pointers_attempted + pvs.three_pointers_attempted)::numeric * 100
        FROM public.player_video_stats pvs 
        WHERE pvs.game_number = vgs.game_number
      ), 1)
    ELSE 0 
  END;
