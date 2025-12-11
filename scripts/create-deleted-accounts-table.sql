-- Create deleted_accounts table to track deleted user accounts
CREATE TABLE IF NOT EXISTS deleted_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_user_id ON deleted_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_email ON deleted_accounts(email);

-- Enable RLS
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own deleted account record
CREATE POLICY "Users can view own deleted account"
  ON deleted_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own deletion record
CREATE POLICY "Users can insert own deletion record"
  ON deleted_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
