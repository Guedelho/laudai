-- Replace combined sex text with separate sex + neutered fields
alter table pets add column if not exists neutered boolean;
alter table laudos add column if not exists neutered boolean;

-- sex column already exists from previous migration, keep it as M/F only
