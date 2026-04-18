alter table laudos add column if not exists pet_id uuid references pets(id) on delete set null;
alter table laudos add column if not exists clinic_id uuid references clinics(id) on delete set null;
alter table laudos add column if not exists vet_id uuid references clinic_vets(id) on delete set null;
