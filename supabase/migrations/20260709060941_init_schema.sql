-- Create user_state table
create table public.user_state (
  user_id uuid references auth.users not null primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.user_state enable row level security;

-- Create policies for user access
create policy "Users can view their own state"
  on public.user_state for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own state"
  on public.user_state for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own state"
  on public.user_state for update
  using ( auth.uid() = user_id );
