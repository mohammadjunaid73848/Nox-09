-- User memories table
CREATE TABLE IF NOT EXISTS public.user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,              -- e.g., 'name', 'occupation', 'note'
  value TEXT NOT NULL,            -- stored memory content
  category TEXT NOT NULL DEFAULT 'note', -- name | occupation | note
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure one memory per (user_id, key)
CREATE UNIQUE INDEX IF NOT EXISTS user_memories_user_key_idx ON public.user_memories (user_id, key);

ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "users can select their memories" ON public.user_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert their memories" ON public.user_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update their memories" ON public.user_memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete their memories" ON public.user_memories
  FOR DELETE USING (auth.uid() = user_id);
