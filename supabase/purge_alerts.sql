-- ========================================================
-- STOP NWS/STAN POLLING AND PURGE DATA
-- ========================================================

-- 1. Unschedule the cron jobs
DO $$ 
BEGIN
    PERFORM cron.unschedule('poll_nws_alerts');
    PERFORM cron.unschedule('poll_stan_alerts');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some cron jobs were already unscheduled.';
END $$;

-- 2. Identify and delete posts related to automated alerts
-- We delete posts linked to stan_alerts first
DELETE FROM public.posts
WHERE id IN (
  SELECT post_id FROM public.stan_alerts
);

-- 3. Delete notifications related to official alerts
DELETE FROM public.notifications
WHERE type = 'official_alert';

-- 4. Purge the alert archive
-- We can truncate or delete selectively. Selectively is safer if they want some later.
-- But the user said "delete them" and "check all environments".
DELETE FROM public.stan_alerts;

-- 5. Final Schema Cache Reload
NOTIFY pgrst, 'reload schema';
