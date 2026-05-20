create extension if not exists pg_cron;

select cron.schedule(
  'cleanup_rate_limits_hourly',
  '0 * * * *',
  $$select public.cleanup_rate_limits();$$
);
