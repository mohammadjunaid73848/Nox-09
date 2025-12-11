-- Add a separate attachments column to store image URLs or metadata
-- This is optional but recommended for better performance

-- Add attachments JSONB column to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT NULL;

-- Create an index on attachments for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_attachments 
ON public.chat_messages USING GIN (attachments);

-- Add a comment explaining the structure
COMMENT ON COLUMN public.chat_messages.attachments IS 
'Stores attachment metadata as JSON array: [{"name": "file.jpg", "type": "image", "size": 12345, "url": "data:image/..."}]';
