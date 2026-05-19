-- laudai v1.0 — full schema
-- Run this in your Supabase SQL editor to set up the database from scratch.

-- ═══════════════════════════════════════════════════════════════════════════
-- profiles
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text,
  crmv                text,
  cpf                 text,
  crmv_state          text,
  logo_url            text,
  signature_font      text,
  signature           text,
  signature_image_url text,
  created_at          timestamptz default now() not null,

  constraint profiles_full_name_len check (char_length(full_name) <= 200),
  constraint profiles_cpf_len check (char_length(cpf) <= 14),
  constraint profiles_crmv_len check (char_length(crmv) <= 20),
  constraint profiles_crmv_state_len check (char_length(crmv_state) <= 2),

  -- Anti-abuse: one CPF and one (CRMV, state) per real person.
  -- NULLs allowed (multiple NULLs OK in Postgres by default).
  constraint profiles_cpf_unique unique (cpf),
  constraint profiles_crmv_unique unique (crmv, crmv_state)
);

alter table profiles enable row level security;

create policy "Users can manage their own profile"
  on profiles for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ═══════════════════════════════════════════════════════════════════════════
-- plans
-- Catalog of subscription plans. Referenced by organizations.plan (FK).
-- Plan enforcement (member counts, features) is application-level — no quotas in DB.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists plans (
  id           text primary key,
  display_name text not null,
  description  text,
  created_at   timestamptz not null default now(),
  constraint plans_id_format check (id ~ '^[a-z0-9_]+$')
);

insert into plans (id, display_name, description) values
  ('basic',        'Básico',       'Plano gratuito para uso individual.'),
  ('professional', 'Profissional', 'Plano individual com geração prioritária e recursos avançados.'),
  ('teams',        'Times',        'Plano para clínicas com múltiplos profissionais.')
on conflict (id) do nothing;

-- Plans are public read so the upgrade UI can list them without a service-role hop.
alter table plans enable row level security;

create policy "plans public read" on plans for select to authenticated using (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- organizations + memberships
-- Every user belongs to at least one org. Solo plans are an org-of-1.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  plan          text not null default 'basic' references plans(id) on update cascade on delete restrict,
  owner_user_id uuid references auth.users(id) on delete restrict not null,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz,

  constraint orgs_name_len check (char_length(name) between 1 and 200),
  constraint orgs_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{0,63}$')
);

create index if not exists organizations_owner_idx on organizations(owner_user_id);
create index if not exists organizations_plan_idx  on organizations(plan);

alter table organizations enable row level security;

create table if not exists organization_members (
  org_id     uuid references organizations(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  role       text not null check (role in ('owner', 'admin', 'member')),
  invited_by uuid references auth.users(id),
  joined_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);

create unique index if not exists organization_members_one_owner_per_org
  on organization_members(org_id) where role = 'owner';

create index if not exists organization_members_user_id_idx on organization_members(user_id);

alter table organization_members enable row level security;

-- Policies on organizations (defined after members table so EXISTS subqueries are valid).
create policy "members read their orgs"
  on organizations for select to authenticated
  using (
    exists (
      select 1 from organization_members m
      where m.org_id = organizations.id and m.user_id = (select auth.uid())
    )
  );

create policy "owner updates own org"
  on organizations for update to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

-- Policies on organization_members.
create policy "members read same-org memberships"
  on organization_members for select to authenticated
  using (
    exists (
      select 1 from organization_members self
      where self.org_id = organization_members.org_id and self.user_id = (select auth.uid())
    )
  );

create policy "owners admins manage members"
  on organization_members for all to authenticated
  using (
    exists (
      select 1 from organization_members self
      where self.org_id = organization_members.org_id
        and self.user_id = (select auth.uid())
        and self.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from organization_members self
      where self.org_id = organization_members.org_id
        and self.user_id = (select auth.uid())
        and self.role in ('owner', 'admin')
    )
  );

create table if not exists organization_invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade not null,
  email       text not null,
  role        text not null check (role in ('admin', 'member')),
  token       text unique not null,
  expires_at  timestamptz not null,
  invited_by  uuid references auth.users(id) not null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

create unique index if not exists organization_invitations_pending_unique
  on organization_invitations(org_id, email) where accepted_at is null;

create index if not exists organization_invitations_org_idx   on organization_invitations(org_id);
create index if not exists organization_invitations_token_idx on organization_invitations(token);

alter table organization_invitations enable row level security;

create policy "members read org invitations"
  on organization_invitations for select to authenticated
  using (
    exists (
      select 1 from organization_members m
      where m.org_id = organization_invitations.org_id and m.user_id = (select auth.uid())
    )
  );

create policy "owners admins manage invitations"
  on organization_invitations for all to authenticated
  using (
    exists (
      select 1 from organization_members m
      where m.org_id = organization_invitations.org_id
        and m.user_id = (select auth.uid())
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from organization_members m
      where m.org_id = organization_invitations.org_id
        and m.user_id = (select auth.uid())
        and m.role in ('owner', 'admin')
    )
  );

-- Atomically create a solo (basic plan) org with the user as owner.
create or replace function create_solo_org(p_user_id uuid, p_name text, p_slug text)
returns uuid
language plpgsql
security definer
as $$
declare
  v_org_id uuid;
begin
  insert into organizations (name, slug, plan, owner_user_id)
  values (p_name, p_slug, 'basic', p_user_id)
  returning id into v_org_id;

  insert into organization_members (org_id, user_id, role)
  values (v_org_id, p_user_id, 'owner');

  return v_org_id;
end;
$$;

revoke all on function create_solo_org(uuid, text, text) from anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- pets
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists pets (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  org_id     uuid references organizations(id) on delete cascade not null,
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

create index if not exists pets_user_id_idx on pets(user_id);
create index if not exists pets_org_id_idx  on pets(org_id);

alter table pets enable row level security;

create policy "Users can manage their own pets"
  on pets for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "org members read pets"
  on pets for select to authenticated
  using (exists (select 1 from organization_members m where m.org_id = pets.org_id and m.user_id = (select auth.uid())));

-- ═══════════════════════════════════════════════════════════════════════════
-- clinics
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists clinics (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  org_id     uuid references organizations(id) on delete cascade not null,
  name       text not null,
  created_at timestamptz default now() not null,

  constraint clinics_name_len check (char_length(name) <= 200)
);

create index if not exists clinics_user_id_idx on clinics(user_id);
create index if not exists clinics_org_id_idx  on clinics(org_id);

alter table clinics enable row level security;

create policy "Users can manage their own clinics"
  on clinics for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "org members read clinics"
  on clinics for select to authenticated
  using (exists (select 1 from organization_members m where m.org_id = clinics.org_id and m.user_id = (select auth.uid())));

-- ═══════════════════════════════════════════════════════════════════════════
-- clinic_vets
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists clinic_vets (
  id         uuid default gen_random_uuid() primary key,
  clinic_id  uuid references clinics(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  org_id     uuid references organizations(id) on delete cascade not null,
  name       text not null,
  created_at timestamptz default now() not null,

  constraint clinic_vets_name_len check (char_length(name) <= 200)
);

create index if not exists clinic_vets_clinic_id_idx on clinic_vets(clinic_id);
create index if not exists clinic_vets_user_id_idx   on clinic_vets(user_id);
create index if not exists clinic_vets_org_id_idx    on clinic_vets(org_id);

alter table clinic_vets enable row level security;

create policy "Users can manage their own clinic vets"
  on clinic_vets for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "org members read clinic_vets"
  on clinic_vets for select to authenticated
  using (exists (select 1 from organization_members m where m.org_id = clinic_vets.org_id and m.user_id = (select auth.uid())));

-- ═══════════════════════════════════════════════════════════════════════════
-- reports
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists reports (
  id                      uuid default gen_random_uuid() primary key,
  user_id                 uuid references auth.users(id) on delete cascade not null,
  org_id                  uuid references organizations(id) on delete cascade not null,
  specialty               text not null,
  patient_name            text not null,
  species                 text not null,
  breed                   text,
  age                     text,
  sex                     text,
  neutered                boolean,
  owner_name              text not null,
  clinic_name             text,
  responsible_vet         text,
  raw_input               text not null,
  generated_content       text,
  edited_content          text,
  exam_date               date,
  pdf_storage_path        text,
  deleted_at              timestamptz,
  pet_id                  uuid references pets(id) on delete set null,
  clinic_id               uuid references clinics(id) on delete set null,
  vet_id                  uuid references clinic_vets(id) on delete set null,
  status                  text not null default 'completed'
                          check (status in ('pending','generating','completed','failed')),
  error_message           text,
  generation_started_at   timestamptz,
  generation_completed_at timestamptz,
  updated_by              uuid references auth.users(id),
  created_at              timestamptz default now() not null,
  updated_at              timestamptz,

  constraint reports_specialty_len         check (char_length(specialty) <= 50),
  constraint reports_patient_name_len      check (char_length(patient_name) <= 200),
  constraint reports_species_len           check (char_length(species) <= 100),
  constraint reports_breed_len             check (char_length(breed) <= 100),
  constraint reports_age_len               check (char_length(age) <= 100),
  constraint reports_sex_len               check (char_length(sex) <= 10),
  constraint reports_owner_name_len        check (char_length(owner_name) <= 200),
  constraint reports_clinic_name_len       check (char_length(clinic_name) <= 200),
  constraint reports_responsible_vet_len   check (char_length(responsible_vet) <= 200),
  constraint reports_raw_input_len         check (char_length(raw_input) <= 2000),
  constraint reports_generated_content_len check (char_length(generated_content) <= 50000),
  constraint reports_edited_content_len    check (char_length(edited_content) <= 50000)
);

-- Dashboard: in-progress + stale-job sweep.
create index if not exists reports_status_user_idx
  on reports(user_id, status) where status in ('pending','generating');

-- Dashboard: per-user feed sorted by created_at desc, excluding soft-deletes.
create index if not exists reports_user_id_created_idx
  on reports(user_id, created_at desc) where deleted_at is null;

create index if not exists reports_org_id_idx     on reports(org_id);
create index if not exists reports_updated_by_idx on reports(updated_by);

-- FK-direction lookups ("all reports for this pet/clinic/vet").
create index if not exists reports_pet_id_idx    on reports(pet_id)    where pet_id    is not null;
create index if not exists reports_clinic_id_idx on reports(clinic_id) where clinic_id is not null;
create index if not exists reports_vet_id_idx    on reports(vet_id)    where vet_id    is not null;

alter table reports enable row level security;

create policy "Users can manage their own reports"
  on reports for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "org members read reports"
  on reports for select to authenticated
  using (exists (select 1 from organization_members m where m.org_id = reports.org_id and m.user_id = (select auth.uid())));

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

-- ═══════════════════════════════════════════════════════════════════════════
-- report_versions
-- Append-only audit log of laudo edits. Each PATCH on a report inserts one row
-- here before updating reports.edited_content. The latest version is
-- reports.edited_content itself; this table is read only on "Ver histórico"
-- and compliance export. Versions are immutable (no UPDATE/DELETE policies).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists report_versions (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid references reports(id) on delete cascade not null,
  edited_by  uuid references auth.users(id) not null,
  content    text not null,
  version    int not null,
  created_at timestamptz not null default now(),

  unique (report_id, version)
);

create index if not exists report_versions_report_version_idx
  on report_versions(report_id, version desc);

create index if not exists report_versions_edited_by_idx
  on report_versions(edited_by);

alter table report_versions enable row level security;

create policy "org members read report versions"
  on report_versions for select to authenticated
  using (
    exists (
      select 1 from reports r
      join organization_members m on m.org_id = r.org_id
      where r.id = report_versions.report_id and m.user_id = (select auth.uid())
    )
  );

create policy "org members insert report versions"
  on report_versions for insert to authenticated
  with check (
    edited_by = (select auth.uid())
    and exists (
      select 1 from reports r
      join organization_members m on m.org_id = r.org_id
      where r.id = report_versions.report_id and m.user_id = (select auth.uid())
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- report_images
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists report_images (
  id           uuid default gen_random_uuid() primary key,
  report_id    uuid references reports(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  org_id       uuid references organizations(id) on delete cascade not null,
  storage_path text not null,
  file_name    text not null,
  created_at   timestamptz default now() not null,

  constraint report_images_file_name_len    check (char_length(file_name) <= 255),
  constraint report_images_storage_path_len check (char_length(storage_path) <= 500)
);

create index if not exists report_images_report_id_idx on report_images(report_id);
create index if not exists report_images_user_id_idx   on report_images(user_id);
create index if not exists report_images_org_id_idx    on report_images(org_id);

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

create policy "org members read report_images"
  on report_images for select to authenticated
  using (exists (select 1 from organization_members m where m.org_id = report_images.org_id and m.user_id = (select auth.uid())));

-- ═══════════════════════════════════════════════════════════════════════════
-- consents (LGPD)
-- ═══════════════════════════════════════════════════════════════════════════

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
  on consents for select to authenticated
  using ((select auth.uid()) = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Trigger: keep reports.updated_at current
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- Permissions
-- anon: no access. authenticated: SELECT only (further restricted by RLS).
-- All writes go through API routes using the service role.
-- ═══════════════════════════════════════════════════════════════════════════

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select on all tables in schema public to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- Rate limiting (Postgres-backed sliding window)
-- Shared across all Vercel function instances. API routes invoke
-- rate_limit_consume() via RPC. Authenticated clients have no direct access.
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- Storage buckets
-- Create via Supabase dashboard or API:
--   report-images (private, 5 MB, image/jpeg + image/png + image/webp)
--   report-pdfs   (private, 50 MB, application/pdf)
--   profile-logos (private, 5 MB, image/jpeg + image/png + image/webp)
--
-- Storage RLS: SELECT only for authenticated users, scoped to own folder.
-- All writes go through API routes using the service role.
-- ═══════════════════════════════════════════════════════════════════════════
