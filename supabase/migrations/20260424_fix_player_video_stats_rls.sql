-- Fix: Add anonymous access to player_video_stats table
--
-- Currently the table only allows authenticated users to insert/update,
-- which blocks the frontend from saving video stats.
-- This migration enables anonymous users to insert and update stats.

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.player_video_stats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Add INSERT policy for anonymous users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'player_video_stats' AND policyname = 'Enable insert for anonymous users'
  ) THEN
    CREATE POLICY "Enable insert for anonymous users" ON public.player_video_stats
      FOR INSERT WITH CHECK (true);
  END IF;

  -- Add UPDATE policy for anonymous users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'player_video_stats' AND policyname = 'Enable update for anonymous users'
  ) THEN
    CREATE POLICY "Enable update for anonymous users" ON public.player_video_stats
      FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
