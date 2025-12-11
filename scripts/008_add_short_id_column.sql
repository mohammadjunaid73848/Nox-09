-- Add short_id column to chat_sessions table for public sharing
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS short_id TEXT UNIQUE;

-- Create index for faster lookups by short_id
CREATE INDEX IF NOT EXISTS idx_chat_sessions_short_id 
ON chat_sessions(short_id) 
WHERE short_id IS NOT NULL;

-- Update RLS policy to allow viewing public chats by short_id
CREATE POLICY "Anyone can view public chats by short_id" ON public.chat_sessions
  FOR SELECT USING (is_public = true AND short_id IS NOT NULL);
