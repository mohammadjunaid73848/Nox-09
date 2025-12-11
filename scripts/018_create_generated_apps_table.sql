CREATE TABLE IF NOT EXISTS generated_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  code JSONB NOT NULL,
  dependencies TEXT[] DEFAULT '{}',
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_apps_user_id ON generated_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_apps_created_at ON generated_apps(created_at DESC);

-- RLS Policies
ALTER TABLE generated_apps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own apps" ON generated_apps;
CREATE POLICY "Users can view their own apps"
  ON generated_apps FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create apps" ON generated_apps;
CREATE POLICY "Users can create apps"
  ON generated_apps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own apps" ON generated_apps;
CREATE POLICY "Users can update their own apps"
  ON generated_apps FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own apps" ON generated_apps;
CREATE POLICY "Users can delete their own apps"
  ON generated_apps FOR DELETE
  USING (auth.uid() = user_id);
