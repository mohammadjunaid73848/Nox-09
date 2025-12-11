-- Create user_ages table for age verification
CREATE TABLE IF NOT EXISTS user_ages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER NOT NULL CHECK (age >= 16 AND age <= 120),
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_ages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own age
CREATE POLICY "Users can read own age"
  ON user_ages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own age
CREATE POLICY "Users can insert own age"
  ON user_ages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own age
CREATE POLICY "Users can update own age"
  ON user_ages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_ages_user_id ON user_ages(user_id);
