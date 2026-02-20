-- Create a new table for storing stats derived from video analysis
CREATE TABLE IF NOT EXISTS public.player_video_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id TEXT NOT NULL, -- references player_slug in player_info (or similar)
    game_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Shooting Stats (Video Verified)
    two_pointers_made INTEGER DEFAULT 0,
    two_pointers_attempted INTEGER DEFAULT 0,
    three_pointers_made INTEGER DEFAULT 0,
    three_pointers_attempted INTEGER DEFAULT 0,
    
    -- Other Video Verified Stats
    steals INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    rebounds INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,

    -- Constraints to ensure one entry per player per game
    UNIQUE(player_id, game_number)
);

-- Add RLS policies (optional, but good practice)
ALTER TABLE public.player_video_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.player_video_stats
    FOR SELECT USING (true);

CREATE POLICY "Enable insert/update for authenticated users only" ON public.player_video_stats
    FOR ALL USING (auth.role() = 'authenticated');
