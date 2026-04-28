-- ========================================================
-- SETX360: SOCIAL ALERTS (NOTIFICATIONS) MIGRATION
-- Infrastructure for real-time notifications and automated triggers
-- ========================================================

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'like', 'comment', 'follow', 'mention', 'repost',
    'order_placed', 'order_shipped', 'payout_approved',
    'group_invite', 'announcement'
  )),
  content TEXT,
  reference_id UUID, -- Generic pointer (post_id, order_id, etc)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON public.notifications(recipient_id, is_read);

-- 2. SECURITY & RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- 3. AUTOMATED TRIGGERS

-- A. Notification on Upvote/Like
CREATE OR REPLACE FUNCTION public.on_post_voted_notify()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
BEGIN
    SELECT profile_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
    
    -- Don't notify if voting on own post
    IF post_author_id != NEW.user_id AND NEW.vote_type = 1 THEN
        INSERT INTO public.notifications (recipient_id, sender_id, type, reference_id, content)
        VALUES (
            post_author_id, 
            NEW.user_id, 
            'like', 
            NEW.post_id, 
            'liked your post'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_on_post_voted_notify
AFTER INSERT ON public.post_votes
FOR EACH ROW EXECUTE FUNCTION public.on_post_voted_notify();

-- B. Notification on Comment
CREATE OR REPLACE FUNCTION public.on_post_commented_notify()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
BEGIN
    SELECT profile_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
    
    IF post_author_id != NEW.profile_id THEN
        INSERT INTO public.notifications (recipient_id, sender_id, type, reference_id, content)
        VALUES (
            post_author_id, 
            NEW.profile_id, 
            'comment', 
            NEW.post_id, 
            'commented on your post'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_on_post_commented_notify
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.on_post_commented_notify();

-- C. Notification on Follow
CREATE OR REPLACE FUNCTION public.on_user_followed_notify()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (recipient_id, sender_id, type, content)
    VALUES (
        NEW.following_id, 
        NEW.follower_id, 
        'follow', 
        'started following you'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_on_user_followed_notify
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.on_user_followed_notify();

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
