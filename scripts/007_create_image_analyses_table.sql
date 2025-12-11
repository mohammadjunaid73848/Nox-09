-- Create table to cache image analyses so models don't need to re-analyze images
CREATE TABLE IF NOT EXISTS image_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_hash TEXT NOT NULL UNIQUE, -- Hash of the image data to identify duplicates
  analysis_text TEXT NOT NULL, -- The brief image description
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_image_analyses_hash ON image_analyses(image_hash);

-- Add RLS policies
ALTER TABLE image_analyses ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read cached analyses
CREATE POLICY "Anyone can read image analyses"
  ON image_analyses FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to insert new analyses
CREATE POLICY "Anyone can insert image analyses"
  ON image_analyses FOR INSERT
  TO authenticated
  WITH CHECK (true);
