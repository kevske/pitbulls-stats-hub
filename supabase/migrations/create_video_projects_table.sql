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

CREATE TRIGGER update_video_projects_timestamp
  BEFORE UPDATE ON video_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_video_projects_updated_at();

-- Create policies

-- Allow anonymous read access (anyone can view the projects)
CREATE POLICY "Allow anonymous read access" ON video_projects
  FOR SELECT USING (true);

-- Allow authenticated insert (logged in users can create projects)
CREATE POLICY "Allow authenticated insert" ON video_projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated update (logged in users can update projects)
CREATE POLICY "Allow authenticated update" ON video_projects
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated delete (logged in users can delete projects)
CREATE POLICY "Allow authenticated delete" ON video_projects
  FOR DELETE USING (auth.role() = 'authenticated');
