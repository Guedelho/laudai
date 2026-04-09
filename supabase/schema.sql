-- Run this in your Supabase SQL editor to set up the full schema from scratch.

-- ─── profiles ───────────────────────────────────────────────────────────────

create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  crmv       text not null,
  cpf        text,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Users manage their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── pets ────────────────────────────────────────────────────────────────────

create table if not exists pets (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  species    text not null,
  breed      text,
  age        text,
  sex        text,
  neutered   boolean,
  owner_name text not null,
  created_at timestamptz default now() not null
);

alter table pets enable row level security;

create policy "Users manage their own pets"
  on pets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── clinics ─────────────────────────────────────────────────────────────────

create table if not exists clinics (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  created_at timestamptz default now() not null
);

alter table clinics enable row level security;

create policy "Users manage their own clinics"
  on clinics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── clinic_vets ─────────────────────────────────────────────────────────────

create table if not exists clinic_vets (
  id         uuid default gen_random_uuid() primary key,
  clinic_id  uuid references clinics(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  created_at timestamptz default now() not null
);

alter table clinic_vets enable row level security;

create policy "Users manage their own clinic vets"
  on clinic_vets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── laudos ──────────────────────────────────────────────────────────────────

create table if not exists laudos (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references auth.users(id) on delete cascade not null,
  specialty         text not null,
  patient_name      text not null,
  species           text not null,
  breed             text,
  age               text,
  sex               text,
  neutered          boolean,
  owner_name        text not null,
  clinic_name       text,
  responsible_vet   text,
  raw_input         text not null,
  generated_content text not null,
  pet_id            uuid references pets(id) on delete set null,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);

alter table laudos enable row level security;

create policy "Users manage their own laudos"
  on laudos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── laudo_images ─────────────────────────────────────────────────────────────

create table if not exists laudo_images (
  id           uuid default gen_random_uuid() primary key,
  laudo_id     uuid references laudos(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  storage_path text not null,
  file_name    text,
  created_at   timestamptz default now() not null
);

alter table laudo_images enable row level security;

create policy "Users manage their own laudo images"
  on laudo_images for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Trigger: keep laudos.updated_at current ─────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger laudos_updated_at
  before update on laudos
  for each row execute procedure update_updated_at();
