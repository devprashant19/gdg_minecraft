-- Free tier cleanup job (runs daily at 03:15 UTC)
create extension if not exists pg_cron;
select cron.schedule('purge-registration-attempts', '15 3 * * *',
  $$delete from public.registration_attempts where created_at < now() - interval '2 days'$$);

