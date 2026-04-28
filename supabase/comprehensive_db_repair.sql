-- COMPREHENSIVE DB REPAIR
-- Date: 2026-04-21

-- 1. FIX PROFILES TABLE (Add missing geographic columns)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS community TEXT,
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. CREATE NOTIFICATIONS INFRASTRUCTURE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT,
  reference_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON public.notifications(recipient_id, is_read);

-- 3. SECURITY & RLS FOR NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
    CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);
    
    DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
    CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);
    
    DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
    CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 4. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(user_id_val UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.notifications SET is_read = TRUE 
    WHERE recipient_id = user_id_val AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
