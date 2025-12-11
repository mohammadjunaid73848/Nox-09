-- Create storage bucket for avatar images
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-images', 'avatar-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for avatar images
CREATE POLICY "Anyone can view avatar images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatar-images');

CREATE POLICY "Authenticated users can upload avatar images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatar-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own avatar images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatar-images' AND auth.uid()::text = (storage.foldername(name))[1]);
