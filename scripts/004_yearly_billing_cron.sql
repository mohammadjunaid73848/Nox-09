-- Create cron job for yearly billing checks
-- This runs every day at 00:00 UTC to check if any subscriptions need billing

-- Enable pg_cron extension if not already enabled
create extension if not exists pg_cron with schema extensions;

-- Create function to process yearly billing
create or replace function process_yearly_billing()
returns table(processed_count int) as $$
declare
  v_processed_count int := 0;
begin
  -- Find all subscriptions where next_billing_date has passed
  -- and status is 'active' or 'payment_due'
  update subscriptions
  set
    status = case
      when status = 'active' then 'payment_due'
      when status = 'payment_due' then 'payment_due'
      else status
    end,
    payment_due_date = current_timestamp + interval '3 days',
    updated_at = current_timestamp
  where
    next_billing_date <= current_timestamp
    and status in ('active', 'payment_due')
    and plan_type = 'pro_yearly'
  returning id;
  
  get diagnostics v_processed_count = row_count;
  return query select v_processed_count;
end;
$$ language plpgsql security definer;

-- Schedule the cron job to run daily at midnight UTC
-- Format: minute hour day-of-month month day-of-week
select cron.schedule(
  'process_yearly_billing_job',
  '0 0 * * *',  -- Daily at 00:00 UTC
  'select process_yearly_billing()'
);

-- Grant execute permission to authenticated users
grant execute on function process_yearly_billing() to authenticated;

-- Add indexes for better query performance
create index if not exists idx_subscriptions_next_billing_date 
  on subscriptions(next_billing_date) 
  where status in ('active', 'payment_due');

create index if not exists idx_subscriptions_plan_type 
  on subscriptions(plan_type);
