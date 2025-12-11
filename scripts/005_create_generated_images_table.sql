-- Create table for storing generated images
CREATE TABLE IF NOT EXISTS public.generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL CHECK (aspect_ratio IN ('square', '16:9', '9:16')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries on created_at
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON public.generated_images(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read images (no login required)
CREATE POLICY "Anyone can view generated images"
  ON public.generated_images
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert images (no login required)
CREATE POLICY "Anyone can generate images"
  ON public.generated_images
  FOR INSERT
  WITH CHECK (true);
