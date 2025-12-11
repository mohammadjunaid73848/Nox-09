-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies to allow authenticated and anonymous users to upload
CREATE POLICY "Anyone can upload chat attachments"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'chat-attachments');

-- Allow anyone to view chat attachments
CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');

-- Allow users to delete their own attachments (optional)
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-attachments');
