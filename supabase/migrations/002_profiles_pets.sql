-- Run this in your Supabase SQL editor

-- Profiles table (extends auth.users with vet info)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  crmv text,
  cpf text,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;
create policy "Users can manage their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Pets table
create table pets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  species text not null,
  breed text,
  age text,
  owner_name text not null,
  created_at timestamptz default now() not null
);

alter table pets enable row level security;
create policy "Users can manage their own pets"
  on pets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add updated_at and pet_id to laudos
alter table laudos add column updated_at timestamptz;
alter table laudos add column pet_id uuid references pets(id) on delete set null;

-- Auto-update updated_at on every row update
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger laudos_updated_at
  before update on laudos
  for each row execute function update_updated_at();
