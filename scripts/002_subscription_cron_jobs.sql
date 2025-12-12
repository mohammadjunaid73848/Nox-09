-- Supabase Cron Jobs for Subscription Billing Management
-- This script sets up automated billing checks using pg_cron (built into Supabase)

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Function to check and update subscriptions after 3-day grace period
CREATE OR REPLACE FUNCTION check_subscription_grace_period()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Expire subscriptions where grace period (3 days) has passed and payment is still due
  UPDATE subscriptions
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status = 'payment_due'
    AND payment_due_date IS NOT NULL
    AND payment_due_date < NOW();
  
  -- Log the number of expired subscriptions
  RAISE NOTICE 'Expired % subscriptions due to unpaid bills', (
    SELECT COUNT(*) FROM subscriptions 
    WHERE status = 'expired' 
    AND updated_at >= NOW() - INTERVAL '1 minute'
  );
END;
$$;

-- Function to send billing reminders (marks subscriptions as payment_due)
CREATE OR REPLACE FUNCTION check_billing_due()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark subscriptions as payment_due when next_billing_date is reached
  -- and set 3-day grace period
  UPDATE subscriptions
  SET 
    status = 'payment_due',
    payment_due_date = next_billing_date + INTERVAL '3 days',
    updated_at = NOW()
  WHERE 
    status = 'active'
    AND next_billing_date IS NOT NULL
    AND next_billing_date <= NOW()
    AND (payment_due_date IS NULL OR payment_due_date < next_billing_date);
  
  RAISE NOTICE 'Marked % subscriptions as payment due', (
    SELECT COUNT(*) FROM subscriptions 
    WHERE status = 'payment_due' 
    AND updated_at >= NOW() - INTERVAL '1 minute'
  );
END;
$$;

-- Schedule cron jobs to run daily at midnight UTC
-- Check for billing due dates
SELECT cron.schedule(
  'check-billing-due',
  '0 0 * * *',  -- Every day at midnight
  $$SELECT check_billing_due()$$
);

-- Check for expired grace periods (run 4 times a day to catch expirations promptly)
SELECT cron.schedule(
  'check-grace-period',
  '0 */6 * * *',  -- Every 6 hours
  $$SELECT check_subscription_grace_period()$$
);

-- View scheduled jobs
SELECT * FROM cron.job;
