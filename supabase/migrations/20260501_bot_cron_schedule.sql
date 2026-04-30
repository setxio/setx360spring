-- Enable pg_cron extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the bot-simulator Edge Function to run every hour
-- IMPORTANT: You must replace 'YOUR_ANON_KEY' with your actual Supabase Anon Key
-- and 'YOUR_PROJECT_REF' with your actual Supabase Project Reference (e.g. okulcpbrikcumiomrzuh)

SELECT cron.schedule(
  'invoke-bot-simulator',
  '0 * * * *', -- Runs at minute 0 past every hour
  $$
    SELECT net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/bot-simulator',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:=concat('{"time": "', current_timestamp, '"}')::jsonb
    ) as request_id;
  $$
);

-- Note: If you ever need to stop the bots, run:
-- SELECT cron.unschedule('invoke-bot-simulator');
