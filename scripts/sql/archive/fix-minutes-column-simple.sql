-- Simple fix: Change minutes_played from INTEGER to NUMERIC to support decimal values
-- This allows storing 12.3667 minutes instead of just 12 minutes

-- Step 1: Drop all views that might depend on minutes_played
DROP VIEW IF EXISTS minutes_entry_view;
DROP VIEW IF EXISTS player_season_totals;
DROP VIEW IF EXISTS player_game_logs;
DROP VIEW IF EXISTS player_stats_summary;
DROP VIEW IF EXISTS team_stats_summary;
DROP VIEW IF EXISTS zero_value_boxscores;

-- Step 2: Change the column type to NUMERIC(10,4) to support decimal minutes
ALTER TABLE box_scores 
ALTER COLUMN minutes_played TYPE NUMERIC(10,4) USING minutes_played::NUMERIC(10,4);

-- Step 3: Update the comment to reflect the change
COMMENT ON COLUMN box_scores.minutes_played IS 'Minutes played by the player in the game (decimal format, e.g., 12.5 = 12 minutes 30 seconds). This data is manually entered as it is not available from public boxscore sources.';

-- Step 4: Recreate the minutes_entry_view with the new column type
CREATE OR REPLACE VIEW minutes_entry_view AS
SELECT 
  bs.game_id,
  bs.player_slug,
  bs.player_first_name,
  bs.player_last_name,
  bs.points,
  bs.two_pointers,
  bs.three_pointers,
  bs.free_throws_made,
  bs.free_throw_attempts,
  bs.fouls,
  bs.minutes_played,
  CASE 
    WHEN bs.minutes_played = 0 AND bs.points > 0 THEN 'Needs minutes'
    WHEN bs.minutes_played > 0 THEN 'Has minutes'
    ELSE 'No stats'
  END as status,
  bs.team_id
FROM box_scores bs
WHERE bs.player_slug IS NOT NULL
ORDER BY bs.game_id, bs.player_last_name, bs.player_first_name;

-- That's it! Now the column can store decimal values like 12.3667 for 12:22
