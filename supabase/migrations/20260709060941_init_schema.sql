-- Create user_state table
create table public.user_state (
  user_id uuid references auth.users not null primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Create recovery_plans table for custom recovery plans
create table public.recovery_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  steps jsonb not null default '[]'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.user_state enable row level security;
alter table public.recovery_plans enable row level security;

-- Create policies for user_state
create policy "Users can view their own state"
  on public.user_state for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own state"
  on public.user_state for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own state"
  on public.user_state for update
  using ( auth.uid() = user_id );

-- Create policies for recovery_plans
create policy "Users can manage their own recovery plans"
  on public.recovery_plans for all
  using ( auth.uid() = user_id );
