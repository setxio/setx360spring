-- ========================================================
-- STOP NWS POLLING (CRON UNSCHEDULE)
-- Run this in the Supabase SQL Editor to stop the automatic 
-- triggering of the NWS polling function.
-- ========================================================

-- 1. Unschedule the cron job gracefully
DO $$ 
BEGIN
    PERFORM cron.unschedule('poll_nws_alerts');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Job poll_nws_alerts not found or already unscheduled.';
END $$;

-- 2. Alternative: Unschedule if it was named differently in your setup
-- SELECT cron.unschedule('poll-nws');

-- Note: The Edge Function itself has also been updated to return 
-- early, so even if the cron runs, it will no longer post alerts.
