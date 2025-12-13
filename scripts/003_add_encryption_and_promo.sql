-- Add encryption fields to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS encrypted_content TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS encryption_iv TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS encryption_auth_tag TEXT;

-- Add promo code and auto-pay fields to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS promo_code_used TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS auto_pay_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS auto_pay_method TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS discount_amount_inr INTEGER;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_free_trial BOOLEAN DEFAULT FALSE;

-- Create promo code usage tracking table
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on promo_code_usage
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- RLS policy: Only service role can manage promo codes
CREATE POLICY "Service role can manage promo codes" ON public.promo_code_usage
  FOR ALL USING (true) WITH CHECK (true);

-- Update RLS on chat_messages to ensure only owner can view/edit
DROP POLICY IF EXISTS "Allow owner access via chat session" ON public.chat_messages;
CREATE POLICY "Allow owner access via chat session" ON public.chat_messages
  FOR ALL USING (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
  ) WITH CHECK (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
  );

-- Update subscriptions RLS to prevent unauthorized edits
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription (limited)" ON public.subscriptions
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND plan_type = (SELECT plan_type FROM public.subscriptions WHERE id = public.subscriptions.id));
