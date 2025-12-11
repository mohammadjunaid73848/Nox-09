-- Drop existing avatars table and related objects
DROP TABLE IF EXISTS avatars CASCADE;

-- Create fresh avatars table with all required columns
CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  character_description TEXT,
  prompt TEXT,
  image_url TEXT,
  logo_url TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name TEXT,
  download_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view public avatars" ON avatars;
DROP POLICY IF EXISTS "Users can view their own avatars" ON avatars;
DROP POLICY IF EXISTS "Users can create avatars" ON avatars;
DROP POLICY IF EXISTS "Users can update their own avatars" ON avatars;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON avatars;

CREATE POLICY "Anyone can view public avatars"
  ON avatars FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own avatars"
  ON avatars FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can create avatars"
  ON avatars FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own avatars"
  ON avatars FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own avatars"
  ON avatars FOR DELETE
  USING (auth.uid() = creator_id);

-- Create indexes
CREATE INDEX idx_avatars_creator_id ON avatars(creator_id);
CREATE INDEX idx_avatars_is_public ON avatars(is_public);
