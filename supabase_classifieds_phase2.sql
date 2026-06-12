-- Enable pg_cron extension if possible (Requires Superuser/DB Owner)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Create classified_events table
CREATE TABLE IF NOT EXISTS public.classified_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    location_name text NOT NULL,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'canceled')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on classified_events
ALTER TABLE public.classified_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active events"
ON public.classified_events FOR SELECT
USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
ON public.classified_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
ON public.classified_events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
ON public.classified_events FOR DELETE
USING (auth.uid() = user_id);

-- 2. Modify classified_items
-- We need to add updated_at, event_id, latitude, longitude, and expand the status check constraint.
ALTER TABLE public.classified_items
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.classified_events(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Update the check constraint for status to include 'rented'
ALTER TABLE public.classified_items DROP CONSTRAINT IF EXISTS classified_items_status_check;
ALTER TABLE public.classified_items ADD CONSTRAINT classified_items_status_check CHECK (status IN ('active', 'pending', 'sold', 'rented'));

-- 3. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.classified_items;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.classified_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 4. Set up pg_cron job to delete sold items older than 3 days
-- Note: If pg_cron isn't active on your Supabase tier, we will also handle hiding them in the frontend UI.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Run daily at midnight to delete items where status is 'sold' and updated_at is more than 3 days ago.
    -- The rented items will stay indefinitely until the user changes them back to active.
    PERFORM cron.schedule('delete_old_sold_items', '0 0 * * *', 'DELETE FROM public.classified_items WHERE status = ''sold'' AND updated_at < now() - interval ''3 days''');
  END IF;
END $$;
