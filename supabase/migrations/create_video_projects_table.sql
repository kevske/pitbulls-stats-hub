-- Create video_projects table to replace JSONBin storage
CREATE TABLE IF NOT EXISTS video_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_number TEXT NOT NULL,
  video_index INTEGER NOT NULL,
  video_id TEXT,
  playlist_id TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_number, video_index)
);

-- Enable Row Level Security (RLS)
ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_video_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_video_projects_timestamp') THEN
        CREATE TRIGGER update_video_projects_timestamp
          BEFORE UPDATE ON video_projects
          FOR EACH ROW
          EXECUTE FUNCTION update_video_projects_updated_at();
    END IF;
END $$;

-- Create policies
DO $$
BEGIN
    -- Allow public select
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'video_projects' AND policyname = 'Allow public select'
    ) THEN
        CREATE POLICY "Allow public select" ON video_projects FOR SELECT USING (true);
    END IF;

    -- Allow public insert
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'video_projects' AND policyname = 'Allow public insert'
    ) THEN
        CREATE POLICY "Allow public insert" ON video_projects FOR INSERT WITH CHECK (true);
    END IF;

    -- Allow public update
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'video_projects' AND policyname = 'Allow public update'
    ) THEN
        CREATE POLICY "Allow public update" ON video_projects FOR UPDATE USING (true);
    END IF;

    -- Allow public delete
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'video_projects' AND policyname = 'Allow public delete'
    ) THEN
        CREATE POLICY "Allow public delete" ON video_projects FOR DELETE USING (true);
    END IF;
END $$;

-- Add to realtime publication if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE video_projects;
  END IF;
END $$;
