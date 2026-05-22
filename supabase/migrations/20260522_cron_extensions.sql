-- Enable extensions if they do not exist
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Revoke and Grant necessary permissions for cron
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Schedule the cron job to run every Sunday at 2:00 AM (UTC)
-- The job will invoke the 'cron-ingest-cvb' edge function
select
  cron.schedule(
    'invoke-cvb-ingest', -- name of the cron job
    '0 2 * * 0',         -- Every Sunday at 2:00 am
    $$
    select
      net.http_post(
          url:='https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/cron-ingest-cvb',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
      ) as request_id;
    $$
  );

-- Note: In a production environment, you should replace 'YOUR_SERVICE_ROLE_KEY' 
-- with a secure method of authenticating the Edge Function or use an anonymous trigger 
-- if the edge function handles its own auth/validation.
