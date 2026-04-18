alter table laudos drop column if exists pet_id;
alter table laudos add column if not exists locked_at timestamptz;
