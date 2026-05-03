-- ═══════════════════════════════════════════════════════════════════
-- FIX SKEWED COUNTERS: Comments, Votes, and Hot Score Logic
-- ═══════════════════════════════════════════════════════════════════

-- 1. Ensure columns exist with correct types and defaults
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS repost_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS upvote_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS downvote_count INT DEFAULT 0;

-- 2. RE-SYNC ALL COUNTERS (Clears any current skew)
UPDATE public.posts p
SET 
  comments_count = (SELECT count(*) FROM public.comments c WHERE c.post_id = p.id),
  upvote_count = (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 1),
  downvote_count = (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = -1),
  repost_count = (SELECT count(*) FROM public.posts r WHERE r.original_post_id = p.id AND r.type = 'repost');

-- 3. Correct the Hot Score Function (fix plural/singular naming)
CREATE OR REPLACE FUNCTION public.calculate_hot_score()
RETURNS TRIGGER AS $$
DECLARE
    age_hours FLOAT;
    v_upvotes INT;
    v_downvotes INT;
BEGIN
    v_upvotes := COALESCE(NEW.upvote_count, 0);
    v_downvotes := COALESCE(NEW.downvote_count, 0);
    age_hours := GREATEST(EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 3600, 0.1);
    
    -- Using 'repost_count' (singular) to match schema.sql
    NEW.hot_score := ((COALESCE(NEW.repost_count, 0) * 25) + (COALESCE(NEW.comments_count, 0) * 13) + (v_upvotes - v_downvotes)) / POWER((age_hours + 2), 1.5);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Robust Trigger for Comment Counts
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_comments_count ON public.comments;
CREATE TRIGGER tr_update_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- 5. Robust Trigger for Vote Counts
CREATE OR REPLACE FUNCTION public.update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.vote_type = 1 THEN
      UPDATE public.posts SET upvote_count = COALESCE(upvote_count, 0) + 1 WHERE id = NEW.post_id;
    ELSE
      UPDATE public.posts SET downvote_count = COALESCE(downvote_count, 0) + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.vote_type = 1 AND NEW.vote_type = -1 THEN
      UPDATE public.posts SET upvote_count = GREATEST(0, COALESCE(upvote_count, 0) - 1), downvote_count = COALESCE(downvote_count, 0) + 1 WHERE id = NEW.post_id;
    ELSIF OLD.vote_type = -1 AND NEW.vote_type = 1 THEN
      UPDATE public.posts SET downvote_count = GREATEST(0, COALESCE(downvote_count, 0) - 1), upvote_count = COALESCE(upvote_count, 0) + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.vote_type = 1 THEN
      UPDATE public.posts SET upvote_count = GREATEST(0, COALESCE(upvote_count, 0) - 1) WHERE id = OLD.post_id;
    ELSE
      UPDATE public.posts SET downvote_count = GREATEST(0, COALESCE(downvote_count, 0) - 1) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_post_vote_counts ON public.post_votes;
CREATE TRIGGER tr_update_post_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.post_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_vote_counts();

-- 6. Trigger for Repost Counts
CREATE OR REPLACE FUNCTION public.update_post_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') AND NEW.type = 'repost' AND NEW.original_post_id IS NOT NULL THEN
    UPDATE public.posts SET repost_count = COALESCE(repost_count, 0) + 1 WHERE id = NEW.original_post_id;
  ELSIF (TG_OP = 'DELETE') AND OLD.type = 'repost' AND OLD.original_post_id IS NOT NULL THEN
    UPDATE public.posts SET repost_count = GREATEST(0, COALESCE(repost_count, 0) - 1) WHERE id = OLD.original_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_repost_count ON public.posts;
CREATE TRIGGER tr_update_repost_count
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_post_repost_count();

-- 7. Ensure hot score is recalculated when any counter changes
DROP TRIGGER IF EXISTS tr_recalc_hot_score ON public.posts;
CREATE TRIGGER tr_recalc_hot_score
  BEFORE UPDATE OF upvote_count, downvote_count, comments_count, repost_count ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.calculate_hot_score();
