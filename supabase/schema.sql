-- Run this in your Supabase SQL editor

create table laudos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  specialty text not null,
  patient_name text not null,
  species text not null,
  breed text,
  age text,
  owner_name text not null,
  raw_input text not null,
  generated_content text not null,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table laudos enable row level security;

-- Users can only access their own laudos
create policy "Users can manage their own laudos"
  on laudos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
