-- Add is_public column to chat_sessions table
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Add index for faster public chat queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_public 
ON chat_sessions(is_public) 
WHERE is_public = true;
