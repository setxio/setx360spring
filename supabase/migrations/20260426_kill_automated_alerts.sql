-- ========================================================
-- KILL AUTOMATED ALERTS & PURGE DATA
-- ========================================================

-- 1. Unschedule the cron jobs gracefully
DO $$ 
BEGIN
    PERFORM cron.unschedule('poll_nws_alerts');
    PERFORM cron.unschedule('poll_stan_alerts');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some cron jobs were already unscheduled or not found.';
END $$;

-- 2. Identify and delete posts related to automated alerts
-- We delete posts linked to stan_alerts first
DELETE FROM public.posts
WHERE id IN (
  SELECT post_id FROM public.stan_alerts
);

-- 3. Also delete any posts that might have missed the link but match the patterns
DELETE FROM public.posts
WHERE content ILIKE '%OFFICIAL NWS ALERT%'
   OR content ILIKE '%OFFICIAL STAN ALERT%'
   OR content ILIKE '%EAN % ALERT%'; -- Kill manual EAN alerts too as requested "all these post types"

-- 4. Delete notifications related to official alerts
DELETE FROM public.notifications
WHERE type = 'official_alert';

-- 5. Purge the alert archive
DELETE FROM public.stan_alerts;

-- 6. Final Schema Cache Reload
NOTIFY pgrst, 'reload schema';
