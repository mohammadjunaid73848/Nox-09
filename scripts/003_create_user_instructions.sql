-- Create user_instructions table to store custom AI instructions
create table if not exists public.user_instructions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instructions text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

-- Enable RLS
alter table public.user_instructions enable row level security;

-- RLS policies
create policy "users_select_own_instructions"
  on public.user_instructions for select
  using (auth.uid() = user_id);

create policy "users_insert_own_instructions"
  on public.user_instructions for insert
  with check (auth.uid() = user_id);

create policy "users_update_own_instructions"
  on public.user_instructions for update
  using (auth.uid() = user_id);

create policy "users_delete_own_instructions"
  on public.user_instructions for delete
  using (auth.uid() = user_id);

-- Create index for faster lookups
create index if not exists user_instructions_user_id_idx on public.user_instructions(user_id);
