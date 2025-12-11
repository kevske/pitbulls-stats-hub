-- Create player_info table
CREATE TABLE IF NOT EXISTS player_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_slug TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT, -- for magic link authentication
  jersey_number INTEGER,
  position TEXT,
  height TEXT,
  weight INTEGER,
  birth_date DATE,
  nationality TEXT,
  bio TEXT,
  achievements TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_player_info_slug ON player_info(player_slug);
CREATE INDEX idx_player_info_active ON player_info(is_active);
CREATE INDEX idx_player_info_last_name ON player_info(last_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_player_info_updated_at 
  BEFORE UPDATE ON player_info 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial player data based on existing player folders
INSERT INTO player_info (player_slug, first_name, last_name, jersey_number, position, is_active) VALUES
('abdullah-ari', 'Abdullah', 'Ari', NULL, NULL, true),
('alexander-rib', 'Alexander', 'Rib', NULL, NULL, true),
('christoph-mrsch', 'Christoph', 'Mrsch', NULL, NULL, true),
('danny-seitz', 'Danny', 'Seitz', NULL, NULL, true),
('david-scheja', 'David', 'Scheja', NULL, NULL, true),
('gregor-arapidis', 'Gregor', 'Arapidis', NULL, NULL, true),
('jan-crocoll', 'Jan', 'Crocoll', NULL, NULL, true),
('jan-strobel', 'Jan', 'Strobel', NULL, NULL, true),
('kevin-rassner', 'Kevin', 'Rassner', NULL, NULL, true),
('marcus-hayes', 'Marcus', 'Hayes', NULL, NULL, true),
('marius-scholl', 'Marius', 'Scholl', NULL, NULL, true),
('nino-de-bortoli', 'Nino', 'De Bortoli', NULL, NULL, true),
('stefan-anselm', 'Stefan', 'Anselm', NULL, NULL, true),
('sven-bader', 'Sven', 'Bader', NULL, NULL, true),
('tim-krause', 'Tim', 'Krause', NULL, NULL, true)
ON CONFLICT (player_slug) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE player_info ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (public for now, adjust as needed)
CREATE POLICY "Allow anonymous read access" ON player_info
  FOR SELECT USING (true);

-- Create policy for insert operations (only authenticated users with matching email)
CREATE POLICY "Allow authenticated insert" ON player_info
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.email() IN (SELECT email FROM player_info WHERE email IS NOT NULL)
  );

-- Create policy for update operations (only authenticated users with matching email)
CREATE POLICY "Allow authenticated update" ON player_info
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    auth.email() IN (SELECT email FROM player_info WHERE email IS NOT NULL)
  );

-- Create policy for delete operations (only authenticated users with matching email)
CREATE POLICY "Allow authenticated delete" ON player_info
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    auth.email() IN (SELECT email FROM player_info WHERE email IS NOT NULL)
  );

-- Create audit_log table for tracking changes
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_email TEXT NOT NULL,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create indexes for audit_log
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user_email ON audit_log(user_email);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_log (read-only for authenticated users, insert for anyone)
CREATE POLICY "Allow authenticated read access" ON audit_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for audit logging" ON audit_log
  FOR INSERT WITH CHECK (true);

-- Create trigger to automatically log changes to player_info
CREATE OR REPLACE FUNCTION log_player_info_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, user_email, user_id)
    VALUES (
      TG_TABLE_NAME,
      OLD.id::text,
      'DELETE',
      row_to_json(OLD),
      COALESCE(current_setting('app.current_user_email', true), 'system'),
      COALESCE(current_setting('app.current_user_id', true), 'system')
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, user_email, user_id)
    VALUES (
      TG_TABLE_NAME,
      NEW.id::text,
      'UPDATE',
      row_to_json(OLD),
      row_to_json(NEW),
      COALESCE(current_setting('app.current_user_email', true), 'system'),
      COALESCE(current_setting('app.current_user_id', true), 'system')
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, record_id, action, new_data, user_email, user_id)
    VALUES (
      TG_TABLE_NAME,
      NEW.id::text,
      'CREATE',
      row_to_json(NEW),
      COALESCE(current_setting('app.current_user_email', true), 'system'),
      COALESCE(current_setting('app.current_user_id', true), 'system')
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for player_info table
DROP TRIGGER IF EXISTS player_info_audit_trigger ON player_info;
CREATE TRIGGER player_info_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON player_info
  FOR EACH ROW EXECUTE FUNCTION log_player_info_changes();
