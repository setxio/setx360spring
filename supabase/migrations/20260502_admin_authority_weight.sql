-- Migration: Admin Authority Weighting
-- Boosts posts and comments from administrators to ensure visibility.

-- 1. Add priority column to posts and comments
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;

-- 2. Update Hot Score calculation to include priority
-- We give priority a massive boost so it resists time decay longer
CREATE OR REPLACE FUNCTION calculate_hot_score()
RETURNS TRIGGER AS $$
DECLARE
    age_hours FLOAT;
    upvotes INT;
    downvotes INT;
    base_score FLOAT;
BEGIN
    upvotes := COALESCE(NEW.upvote_count, 0);
    downvotes := COALESCE(NEW.downvote_count, 0);
    age_hours := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 3600;

    -- Base engagement score
    base_score := (NEW.repost_count * 25) + (NEW.reply_count * 13) + (upvotes - downvotes);
    
    -- Add priority boost (1 priority point = 50 base engagement points)
    base_score := base_score + (COALESCE(NEW.priority, 0) * 50);

    -- Apply time decay
    NEW.hot_score := base_score / POWER((age_hours + 2), 1.5);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger to automatically set priority for Admin posts
CREATE OR REPLACE FUNCTION set_admin_priority()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the author is an admin
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.profile_id AND role = 'admin') THEN
        NEW.priority := COALESCE(NEW.priority, 0) + 1; -- Boost by 1 by default
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_admin_priority_posts ON public.posts;
CREATE TRIGGER tr_set_admin_priority_posts
BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION set_admin_priority();

DROP TRIGGER IF EXISTS tr_set_admin_priority_comments ON public.comments;
CREATE TRIGGER tr_set_admin_priority_comments
BEFORE INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION set_admin_priority();

-- 4. Backfill existing admin posts
UPDATE public.posts 
SET priority = 1 
WHERE profile_id IN (SELECT id FROM public.profiles WHERE role = 'admin');

UPDATE public.comments 
SET priority = 1 
WHERE profile_id IN (SELECT id FROM public.profiles WHERE role = 'admin');
