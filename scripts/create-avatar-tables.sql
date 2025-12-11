-- Create avatar_downloads table to track which avatars users have installed
CREATE TABLE IF NOT EXISTS public.avatar_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, avatar_id)
);

-- Create user_selected_avatar table to track which avatar is currently selected
CREATE TABLE IF NOT EXISTS public.user_selected_avatar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_avatar_downloads_user_id ON public.avatar_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_downloads_avatar_id ON public.avatar_downloads(avatar_id);
CREATE INDEX IF NOT EXISTS idx_user_selected_avatar_user_id ON public.user_selected_avatar(user_id);

-- Enable Row Level Security
ALTER TABLE public.avatar_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_selected_avatar ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for avatar_downloads
CREATE POLICY "Users can view their own downloads" ON public.avatar_downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own downloads" ON public.avatar_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own downloads" ON public.avatar_downloads
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_selected_avatar
CREATE POLICY "Users can view their own selected avatar" ON public.user_selected_avatar
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own selected avatar" ON public.user_selected_avatar
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own selected avatar" ON public.user_selected_avatar
  FOR INSERT WITH CHECK (auth.uid() = user_id);
