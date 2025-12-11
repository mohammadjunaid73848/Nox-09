-- Create default_avatars table to store system avatars separately
CREATE TABLE IF NOT EXISTS default_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  character_description TEXT,
  prompt TEXT,
  image_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_default_avatars_active ON default_avatars(is_active);

-- Enable RLS
ALTER TABLE default_avatars ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow public read access
CREATE POLICY "Allow public read access to default avatars"
  ON default_avatars
  FOR SELECT
  USING (is_active = true);

-- Insert default avatars
INSERT INTO default_avatars (name, description, character_description, prompt, logo_url, order_index, is_active)
VALUES
  ('Nexus', 'Advanced AI Assistant', 'A cutting-edge AI focused on complex problem-solving and analysis', 'You are Nexus, an advanced AI assistant specialized in deep analysis and complex problem-solving.', 'https://api.dicebear.com/7.x/shapes/svg?seed=nexus', 0, true),
  ('Pixel', 'Creative Digital Artist', 'A creative AI that specializes in digital art, design, and visual concepts', 'You are Pixel, a creative AI artist who helps with design, visual concepts, and digital creativity.', 'https://api.dicebear.com/7.x/shapes/svg?seed=pixel', 1, true),
  ('Sage', 'Knowledge Expert', 'A wise AI that provides educational content and deep knowledge on various topics', 'You are Sage, a knowledgeable AI expert who provides educational insights and detailed explanations.', 'https://api.dicebear.com/7.x/shapes/svg?seed=sage', 2, true),
  ('Nova', 'Innovation Catalyst', 'An AI focused on generating innovative ideas and creative solutions', 'You are Nova, an innovation-focused AI that generates creative ideas and novel solutions.', 'https://api.dicebear.com/7.x/shapes/svg?seed=nova', 3, true),
  ('Echo', 'Communication Specialist', 'An AI that excels at clear communication and understanding context', 'You are Echo, a communication specialist AI that focuses on clarity and understanding context.', 'https://api.dicebear.com/7.x/shapes/svg?seed=echo', 4, true);
