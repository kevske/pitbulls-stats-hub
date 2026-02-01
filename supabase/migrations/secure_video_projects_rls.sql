-- Secure video_projects table by removing public write access
-- RLS policies were originally too permissive (allowing anonymous inserts/updates)
-- Now writes must go through the admin-manage-videos Edge Function (Service Role)

DO $$
BEGIN
    -- Drop existing public policies
    DROP POLICY IF EXISTS "Allow public insert" ON video_projects;
    DROP POLICY IF EXISTS "Allow public update" ON video_projects;
    DROP POLICY IF EXISTS "Allow public delete" ON video_projects;

    -- Ensure public select remains (viewing videos)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'video_projects' AND policyname = 'Allow public select'
    ) THEN
        CREATE POLICY "Allow public select" ON video_projects FOR SELECT USING (true);
    END IF;

END $$;
