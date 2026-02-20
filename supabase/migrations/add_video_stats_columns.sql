-- Add missing columns to player_video_stats for complete stat tracking
ALTER TABLE public.player_video_stats
  ADD COLUMN IF NOT EXISTS free_throws_made INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_throws_attempted INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fouls INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- New table for team-level game stats derived from video tagging
CREATE TABLE IF NOT EXISTS public.video_game_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_number INTEGER NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  total_rebounds INTEGER DEFAULT 0,
  total_steals INTEGER DEFAULT 0,
  total_blocks INTEGER DEFAULT 0,
  total_turnovers INTEGER DEFAULT 0,
  total_fouls INTEGER DEFAULT 0,
  team_fg_percentage NUMERIC(5,1) DEFAULT 0,
  team_three_pt_percentage NUMERIC(5,1) DEFAULT 0,
  team_ft_percentage NUMERIC(5,1) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for video_game_stats
ALTER TABLE public.video_game_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.video_game_stats
  FOR SELECT USING (true);

CREATE POLICY "Enable insert/update for authenticated users only" ON public.video_game_stats
  FOR ALL USING (auth.role() = 'authenticated');
