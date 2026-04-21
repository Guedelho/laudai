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
  generated_content text not null,
  edited_content    text,
  exam_date         date,
  pdf_storage_path  text,
  locked_at         timestamptz,
  deleted_at        timestamptz,
  pet_id            uuid references pets(id) on delete set null,
  clinic_id         uuid references clinics(id) on delete set null,
  vet_id            uuid references clinic_vets(id) on delete set null,
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

-- ─── Storage buckets ────────────────────────────────────────────────────────
-- Create via Supabase dashboard or API:
--   report-images (private, 5 MB, image/jpeg + image/png + image/webp)
--   report-pdfs   (private, 50 MB, application/pdf)
--   profile-logos  (private, 5 MB, image/jpeg + image/png + image/webp)
--
-- Storage RLS: SELECT only for authenticated users, scoped to own folder.
-- All writes go through API routes using the service role.
