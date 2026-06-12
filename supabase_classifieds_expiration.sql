-- Phase 6: General Item 30-Day Expiration Auto-Lifecycle

-- 0. Add renewal tracking
ALTER TABLE public.classified_items ADD COLUMN IF NOT EXISTS renewal_count INT DEFAULT 0;

-- 1. Create function to delete expired General Items (Older than 30 days)
CREATE OR REPLACE FUNCTION auto_delete_expired_classified_items()
RETURNS void AS $$
BEGIN
  -- Delete items where updated_at is more than 30 days ago, and category is NOT Vehicles or Real Estate
  DELETE FROM public.classified_items
  WHERE category NOT IN ('Vehicles', 'Property Rentals & Sales')
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function to notify users to renew items 3 days before expiration (At exactly Day 27)
CREATE OR REPLACE FUNCTION notify_expiring_classified_items()
RETURNS void AS $$
DECLARE
  expiring_item RECORD;
BEGIN
  -- Find items that are exactly 27 days old since last update (between 27 and 28 days)
  -- Also ensure they haven't maxed out their 2 renewals
  FOR expiring_item IN
    SELECT id, user_id, title 
    FROM public.classified_items
    WHERE category NOT IN ('Vehicles', 'Property Rentals & Sales')
      AND updated_at < NOW() - INTERVAL '27 days'
      AND updated_at >= NOW() - INTERVAL '28 days'
      AND COALESCE(renewal_count, 0) < 2
  LOOP
    -- Insert a notification for the user
    INSERT INTO public.notifications (
      user_id,
      type,
      message,
      metadata,
      created_at
    ) VALUES (
      expiring_item.user_id,
      'classifieds_expiration',
      'Your item "' || expiring_item.title || '" will expire in 3 days. Renew it to keep it active!',
      jsonb_build_object('item_id', expiring_item.id),
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Schedule the Cron Jobs
-- Note: Make sure pg_cron is enabled in your Supabase Dashboard under Database -> Extensions!
SELECT cron.schedule(
  'delete-expired-classified-items',
  '0 0 * * *',
  'SELECT auto_delete_expired_classified_items();'
);

SELECT cron.schedule(
  'notify-expiring-classified-items',
  '0 0 * * *',
  'SELECT notify_expiring_classified_items();'
);
