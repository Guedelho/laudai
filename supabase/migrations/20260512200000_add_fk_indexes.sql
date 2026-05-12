-- Backfill missing indexes on user_id and FK columns per project invariant:
-- "All FK and user_id columns are indexed" (CLAUDE.md).
-- The original initial migration only created the partial reports_status_user_idx;
-- this migration covers the remaining columns for dashboard / FK-direction queries.

create index if not exists pets_user_id_idx              on pets(user_id);
create index if not exists clinics_user_id_idx           on clinics(user_id);
create index if not exists clinic_vets_clinic_id_idx     on clinic_vets(clinic_id);
create index if not exists clinic_vets_user_id_idx       on clinic_vets(user_id);
create index if not exists report_images_report_id_idx   on report_images(report_id);
create index if not exists report_images_user_id_idx     on report_images(user_id);

-- Dashboard query: where user_id = X and deleted_at is null order by created_at desc.
create index if not exists reports_user_id_created_idx
  on reports(user_id, created_at desc) where deleted_at is null;

-- FK-direction lookups (e.g., "all reports for this pet/clinic/vet").
create index if not exists reports_pet_id_idx            on reports(pet_id)    where pet_id    is not null;
create index if not exists reports_clinic_id_idx         on reports(clinic_id) where clinic_id is not null;
create index if not exists reports_vet_id_idx            on reports(vet_id)    where vet_id    is not null;
