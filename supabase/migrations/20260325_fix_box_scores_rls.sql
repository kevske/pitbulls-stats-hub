-- Fix: Add anonymous read access to box_scores table
-- 
-- The player_season_totals and player_game_logs views depend on box_scores.
-- If RLS is enabled on box_scores without a SELECT policy for anonymous users,
-- these views return empty results, causing the Players page to show no data.
-- 
-- The games table already allows anonymous reads, so game data loads fine.
-- This migration ensures box_scores also allows anonymous SELECT access.

-- Ensure RLS is enabled (idempotent)
ALTER TABLE box_scores ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read box_scores
CREATE POLICY "Allow anonymous read access" ON box_scores
  FOR SELECT USING (true);

-- Also ensure the games table allows anonymous reads (safety net)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'games' AND policyname = 'Allow anonymous read access'
  ) THEN
    CREATE POLICY "Allow anonymous read access" ON games
      FOR SELECT USING (true);
  END IF;
END $$;
