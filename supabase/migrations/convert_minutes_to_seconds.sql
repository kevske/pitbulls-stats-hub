-- Convert minutes_played column to store seconds instead of minutes
-- This allows for precise time tracking with seconds instead of just whole minutes

-- Step 1: Create a new column for seconds
ALTER TABLE box_scores 
ADD COLUMN seconds_played INTEGER DEFAULT 0;

-- Step 2: Migrate existing minutes to seconds (multiply by 60)
UPDATE box_scores 
SET seconds_played = minutes_played * 60 
WHERE minutes_played > 0;

-- Step 3: Add comment to document the purpose
COMMENT ON COLUMN box_scores.seconds_played IS 'Seconds played by the player in the game. This allows for precise time tracking including seconds.';

-- Step 4: Update the function to work with seconds
CREATE OR REPLACE FUNCTION update_player_seconds(
  p_game_id TEXT,
  p_player_slug TEXT,
  p_seconds INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE box_scores 
  SET seconds_played = p_seconds
  WHERE game_id = p_game_id 
    AND player_slug = p_player_slug;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create function to get players missing seconds data
CREATE OR REPLACE FUNCTION get_players_missing_seconds()
RETURNS TABLE(
  game_id TEXT,
  player_slug TEXT,
  player_first_name TEXT,
  player_last_name TEXT,
  points INTEGER,
  team_id
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bs.game_id,
    bs.player_slug,
    bs.player_first_name,
    bs.player_last_name,
    bs.points,
    bs.team_id
  FROM box_scores bs
  WHERE bs.seconds_played = 0 
    AND bs.player_slug IS NOT NULL
    AND bs.points > 0  -- Only players who actually played
  ORDER BY bs.game_id, bs.player_last_name, bs.player_first_name;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Update the view to show seconds (converted to minutes:seconds format)
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
  bs.seconds_played,
  CASE 
    WHEN bs.seconds_played = 0 AND bs.points > 0 THEN 'Needs seconds'
    WHEN bs.seconds_played > 0 THEN 'Has seconds'
    ELSE 'No stats'
  END as status,
  bs.team_id
FROM box_scores bs
WHERE bs.player_slug IS NOT NULL
ORDER BY bs.game_id, bs.player_last_name, bs.player_first_name;

-- Step 7: Add index for performance on seconds queries
CREATE INDEX IF NOT EXISTS idx_boxscores_seconds_played ON box_scores(seconds_played);
CREATE INDEX IF NOT EXISTS idx_boxscores_missing_seconds ON box_scores(game_id, player_slug) WHERE seconds_played = 0;

-- Step 8: (Optional) Drop the old minutes column after confirming migration works
-- ALTER TABLE box_scores DROP COLUMN minutes_played;
-- COMMENT ON COLUMN box_scores.minutes_played IS NULL;
