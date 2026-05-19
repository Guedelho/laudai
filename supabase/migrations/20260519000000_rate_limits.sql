-- Per-user fixed-window rate limiting for authenticated endpoints.
-- Keyed by (user_id, endpoint, window_start) so an attacker rotating IPs
-- can't sidestep the limit on a single logged-in account.

create table if not exists rate_limits (
  user_id      uuid not null references auth.users(id) on delete cascade,
  endpoint     text not null,
  window_start timestamptz not null,
  count        int not null default 1,
  primary key (user_id, endpoint, window_start)
);

create index if not exists rate_limits_window_start_idx on rate_limits(window_start);

alter table rate_limits enable row level security;
-- No policies — service-role only. authenticated/anon never touch this table.

-- Atomic UPSERT-with-increment. Returns the new count after this hit.
create or replace function check_rate_limit(
  p_user_id      uuid,
  p_endpoint     text,
  p_window_start timestamptz
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into rate_limits (user_id, endpoint, window_start, count)
  values (p_user_id, p_endpoint, p_window_start, 1)
  on conflict (user_id, endpoint, window_start)
  do update set count = rate_limits.count + 1
  returning count into v_count;
  return v_count;
end;
$$;

revoke all on function check_rate_limit(uuid, text, timestamptz) from public, anon, authenticated;

-- Sweeper for stale window rows. Wire to /api/internal/sweep-deleted-accounts cron or
-- call ad-hoc — windows older than 1h are no longer relevant for any plausible limit.
create or replace function cleanup_rate_limits() returns void
language sql
security definer
set search_path = public
as $$
  delete from rate_limits where window_start < now() - interval '1 hour';
$$;

revoke all on function cleanup_rate_limits() from public, anon, authenticated;
