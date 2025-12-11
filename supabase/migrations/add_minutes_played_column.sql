-- Add minutes_played column to box_scores table for manual entry
-- This data is not available from public sources and needs to be manually entered
-- Similar to how it was done in Google Sheets

-- Step 1: Add minutes_played column to box_scores table
ALTER TABLE box_scores 
ADD COLUMN minutes_played INTEGER DEFAULT 0;

-- Step 2: Add comment to document the purpose
COMMENT ON COLUMN box_scores.minutes_played IS 'Minutes played by the player in the game. This data is manually entered as it is not available from public boxscore sources.';

-- Step 3: Create function to update minutes for multiple games (bulk entry)
CREATE OR REPLACE FUNCTION update_player_minutes(
  p_game_id TEXT,
  p_player_slug TEXT,
  p_minutes INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE box_scores 
  SET minutes_played = p_minutes
  WHERE game_id = p_game_id 
    AND player_slug = p_player_slug;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create function to get players missing minutes data
CREATE OR REPLACE FUNCTION get_players_missing_minutes()
RETURNS TABLE(
  game_id TEXT,
  player_slug TEXT,
  player_first_name TEXT,
  player_last_name TEXT,
  points INTEGER,
  team_id TEXT
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
  WHERE bs.minutes_played = 0 
    AND bs.player_slug IS NOT NULL
    AND bs.points > 0  -- Only players who actually played
  ORDER BY bs.game_id, bs.player_last_name, bs.player_first_name;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create view for minutes data entry (shows what needs to be filled)
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

-- Step 6: Add index for performance on minutes queries
CREATE INDEX IF NOT EXISTS idx_boxscores_minutes_played ON box_scores(minutes_played);
CREATE INDEX IF NOT EXISTS idx_boxscores_missing_minutes ON box_scores(game_id, player_slug) WHERE minutes_played = 0;
