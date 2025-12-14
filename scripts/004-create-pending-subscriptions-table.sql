-- Create pending_subscriptions table for manual review
CREATE TABLE IF NOT EXISTS pending_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id TEXT NOT NULL UNIQUE,
  gateway TEXT NOT NULL,
  subscriber_email TEXT,
  plan_id TEXT,
  plan_type TEXT,
  amount_inr INTEGER,
  raw_data JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_email ON pending_subscriptions(subscriber_email);
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_resolved ON pending_subscriptions(resolved);

-- Add comment
COMMENT ON TABLE pending_subscriptions IS 'Stores PayPal subscriptions that could not be automatically matched to a user for manual review';
