-- Clinics table
create table clinics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null
);

alter table clinics enable row level security;
create policy "Users can manage their own clinics"
  on clinics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Clinic vets (N per clinic)
create table clinic_vets (
  id uuid default gen_random_uuid() primary key,
  clinic_id uuid references clinics(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null
);

alter table clinic_vets enable row level security;
create policy "Users can manage their own clinic vets"
  on clinic_vets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add sex to pets and laudos
alter table pets add column if not exists sex text;
alter table laudos add column if not exists sex text;
