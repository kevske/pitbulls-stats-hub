-- Migration to link BoxScore table with PlayerInfo using player_slug
-- Only applies to TSV Neuenstadt players to avoid name collisions

-- Step 1: Add player_slug column to box_scores table
ALTER TABLE box_scores 
ADD COLUMN player_slug TEXT;

-- Step 2: Create function to generate slug from names
CREATE OR REPLACE FUNCTION generate_player_slug(first_name TEXT, last_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        COALESCE(first_name, '') || '-' || COALESCE(last_name, ''),
        '[^a-zA-Z-\s]', -- Keep only letters, hyphens, and spaces
        '', 
        'g'
      ),
      '\s+', -- Replace multiple spaces with single hyphen
      '-',
      'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update only TSV Neuenstadt players with matching slugs
-- This ensures we only link our players, not players from other teams with same names
UPDATE box_scores 
SET player_slug = generate_player_slug(player_first_name, player_last_name)
WHERE player_slug IS NULL
  AND EXISTS (
    SELECT 1 FROM player_info 
    WHERE player_slug = generate_player_slug(box_scores.player_first_name, box_scores.player_last_name)
  )
  -- IMPORTANT: Only for TSV Neuenstadt team - replace with actual team_id
  AND team_id = 'tsv-neuenstadt'; -- Update this with your actual team_id

-- Step 4: Add foreign key constraint (only for records that have slugs)
ALTER TABLE box_scores 
ADD CONSTRAINT fk_boxscores_player_slug 
FOREIGN KEY (player_slug) REFERENCES player_info(player_slug);

-- Step 5: Create index for performance
CREATE INDEX idx_boxscores_player_slug ON box_scores(player_slug);

-- Step 6: Create view for easy player stats with info
CREATE OR REPLACE VIEW player_stats_with_info AS
SELECT 
  bs.*,
  pi.first_name as info_first_name,
  pi.last_name as info_last_name,
  pi.email,
  pi.jersey_number,
  pi.position,
  pi.height,
  pi.weight,
  pi.birth_date,
  pi.nationality,
  pi.bio,
  pi.achievements,
  pi.social_links,
  pi.is_active as player_active
FROM box_scores bs
LEFT JOIN player_info pi ON bs.player_slug = pi.player_slug
WHERE bs.team_id = 'tsv-neuenstadt'; -- Filter for your team

-- Step 7: Create function to automatically set slug for new boxscore entries
CREATE OR REPLACE FUNCTION set_boxscore_player_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set slug if it's a TSV Neuenstadt player and matches our player_info
  IF NEW.team_id = 'tsv-neuenstadt' THEN
    SELECT player_slug INTO NEW.player_slug 
    FROM player_info 
    WHERE player_slug = generate_player_slug(NEW.player_first_name, NEW.player_last_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for automatic slug assignment
DROP TRIGGER IF EXISTS boxscores_set_player_slug_trigger ON box_scores;
CREATE TRIGGER boxscores_set_player_slug_trigger
BEFORE INSERT ON box_scores
FOR EACH ROW EXECUTE FUNCTION set_boxscore_player_slug();

-- Step 9: Update existing BoxScore interface documentation
COMMENT ON COLUMN box_scores.player_slug IS 'Foreign key reference to player_info table. Only populated for TSV Neuenstadt players to avoid name collisions with other teams.';

-- Step 10: Create function to find unmatched players (useful for admin)
CREATE OR REPLACE FUNCTION get_unmatched_boxscore_players()
RETURNS TABLE(
  player_first_name TEXT,
  player_last_name TEXT,
  team_id TEXT,
  game_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bs.player_first_name,
    bs.player_last_name,
    bs.team_id,
    COUNT(*) as game_count
  FROM box_scores bs
  WHERE bs.team_id = 'tsv-neuenstadt'
    AND bs.player_slug IS NULL
  GROUP BY bs.player_first_name, bs.player_last_name, bs.team_id
  ORDER BY game_count DESC;
END;
$$ LANGUAGE plpgsql;
