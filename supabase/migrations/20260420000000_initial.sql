-- laudai v1.0 — full schema
-- Run this in your Supabase SQL editor to set up the database from scratch.

-- ─── profiles ───────────────────────────────────────────────────────────────

create table if not exists profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text,
  crmv               text,
  cpf                text,
  crmv_state         text,
  logo_url           text,
  signature_font     text,
  signature          text,
  signature_image_url text,
  created_at         timestamptz default now() not null,

  constraint profiles_full_name_len check (char_length(full_name) <= 200),
  constraint profiles_cpf_len check (char_length(cpf) <= 14),
  constraint profiles_crmv_len check (char_length(crmv) <= 20),
  constraint profiles_crmv_state_len check (char_length(crmv_state) <= 2)
);

alter table profiles enable row level security;

create policy "Users can manage their own profile"
  on profiles for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ─── pets ───────────────────────────────────────────────────────────────────

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
  created_at timestamptz default now() not null,

  constraint pets_name_len check (char_length(name) <= 200),
  constraint pets_owner_name_len check (char_length(owner_name) <= 200),
  constraint pets_species_len check (char_length(species) <= 100),
  constraint pets_breed_len check (char_length(breed) <= 100),
  constraint pets_age_len check (char_length(age) <= 100),
  constraint pets_sex_len check (char_length(sex) <= 10)
);

alter table pets enable row level security;

create policy "Users can manage their own pets"
  on pets for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── clinics ────────────────────────────────────────────────────────────────

create table if not exists clinics (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  created_at timestamptz default now() not null,

  constraint clinics_name_len check (char_length(name) <= 200)
);

alter table clinics enable row level security;

create policy "Users can manage their own clinics"
  on clinics for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── clinic_vets ────────────────────────────────────────────────────────────

create table if not exists clinic_vets (
  id         uuid default gen_random_uuid() primary key,
  clinic_id  uuid references clinics(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  created_at timestamptz default now() not null,

  constraint clinic_vets_name_len check (char_length(name) <= 200)
);

alter table clinic_vets enable row level security;

create policy "Users can manage their own clinic vets"
  on clinic_vets for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── reports ────────────────────────────────────────────────────────────────

create table if not exists reports (
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
  generated_content text,
  edited_content    text,
  exam_date         date,
  pdf_storage_path  text,
  deleted_at        timestamptz,
  pet_id            uuid references pets(id) on delete set null,
  clinic_id         uuid references clinics(id) on delete set null,
  vet_id            uuid references clinic_vets(id) on delete set null,
  status                  text not null default 'completed'
                          check (status in ('pending','generating','completed','failed')),
  error_message           text,
  generation_started_at   timestamptz,
  generation_completed_at timestamptz,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz,

  constraint reports_specialty_len check (char_length(specialty) <= 50),
  constraint reports_patient_name_len check (char_length(patient_name) <= 200),
  constraint reports_species_len check (char_length(species) <= 100),
  constraint reports_breed_len check (char_length(breed) <= 100),
  constraint reports_age_len check (char_length(age) <= 100),
  constraint reports_sex_len check (char_length(sex) <= 10),
  constraint reports_owner_name_len check (char_length(owner_name) <= 200),
  constraint reports_clinic_name_len check (char_length(clinic_name) <= 200),
  constraint reports_responsible_vet_len check (char_length(responsible_vet) <= 200),
  constraint reports_raw_input_len check (char_length(raw_input) <= 2000),
  constraint reports_generated_content_len check (char_length(generated_content) <= 50000),
  constraint reports_edited_content_len check (char_length(edited_content) <= 50000)
);

alter table reports enable row level security;

create policy "Users can manage their own reports"
  on reports for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Idempotent upgrades for existing alpha-test rows.
-- Existing reports keep generated_content; status defaults to 'completed'
-- so they appear as ready in the dashboard.
alter table reports add column if not exists
  status text not null default 'completed';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reports_status_check') then
    alter table reports add constraint reports_status_check
      check (status in ('pending','generating','completed','failed'));
  end if;
end $$;
alter table reports add column if not exists error_message text;
alter table reports add column if not exists generation_started_at timestamptz;
alter table reports add column if not exists generation_completed_at timestamptz;
alter table reports alter column generated_content drop not null;

-- Enable Realtime so the dashboard can subscribe to status changes.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reports'
  ) then
    alter publication supabase_realtime add table reports;
  end if;
end $$;

-- Index for dashboard "in-progress" filter and stale-job sweep.
create index if not exists reports_status_user_idx
  on reports(user_id, status) where status in ('pending','generating');

-- ─── report_images ──────────────────────────────────────────────────────────

create table if not exists report_images (
  id           uuid default gen_random_uuid() primary key,
  report_id    uuid references reports(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  storage_path text not null,
  file_name    text not null,
  created_at   timestamptz default now() not null,

  constraint report_images_file_name_len check (char_length(file_name) <= 255),
  constraint report_images_storage_path_len check (char_length(storage_path) <= 500)
);

alter table report_images enable row level security;

create policy "Users can read their own report images"
  on report_images for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own report images"
  on report_images for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from reports where reports.id = report_id and reports.user_id = (select auth.uid()))
  );

create policy "Users can update their own report images"
  on report_images for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from reports where reports.id = report_id and reports.user_id = (select auth.uid()))
  );

create policy "Users can delete their own report images"
  on report_images for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ─── Trigger: keep reports.updated_at current ───────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger reports_updated_at
  before update on reports
  for each row execute function update_updated_at();

-- ─── Permissions ────────────────────────────────────────────────────────────
-- anon: no access. authenticated: SELECT only. All writes via service role.

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select on all tables in schema public to authenticated;

-- ─── Rate limiting ──────────────────────────────────────────────────────────
-- Postgres-backed sliding-window counter shared across all Vercel function
-- instances. API routes invoke rate_limit_consume(bucket, user_id, max) via RPC
-- (lib/rate-limit.ts → withApiHandler). Authenticated clients have no direct
-- access to the table or the function — both are reached only through the
-- service role.

create table if not exists rate_limit_events (
  id         bigserial primary key,
  bucket     text not null,
  user_id    uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_lookup
  on rate_limit_events(bucket, user_id, created_at desc);

create or replace function rate_limit_consume(
  p_bucket  text,
  p_user_id uuid,
  p_max     int
) returns boolean
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  delete from rate_limit_events
  where bucket = p_bucket
    and user_id = p_user_id
    and created_at < now() - interval '1 minute';

  select count(*) into v_count
  from rate_limit_events
  where bucket = p_bucket
    and user_id = p_user_id;

  if v_count >= p_max then
    return false;
  end if;

  insert into rate_limit_events(bucket, user_id) values (p_bucket, p_user_id);
  return true;
end;
$$;

revoke all on rate_limit_events from anon, authenticated;
revoke all on function rate_limit_consume(text, uuid, int) from anon, authenticated;

-- ─── consents (LGPD) ────────────────────────────────────────────────────────

create table if not exists consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null check (type in ('terms', 'privacy_policy')),
  version     text not null,
  accepted_at timestamptz not null default now(),
  ip          inet
);

create index if not exists consents_user_id_idx on consents(user_id);

alter table consents enable row level security;

create policy "consents self read"
  on consents
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ─── Storage buckets ────────────────────────────────────────────────────────
-- Create via Supabase dashboard or API:
--   report-images (private, 5 MB, image/jpeg + image/png + image/webp)
--   report-pdfs   (private, 50 MB, application/pdf)
--   profile-logos  (private, 5 MB, image/jpeg + image/png + image/webp)
--
-- Storage RLS: SELECT only for authenticated users, scoped to own folder.
-- All writes go through API routes using the service role.
