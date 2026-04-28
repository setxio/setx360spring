-- ═══════════════════════════════════════════════════════════════════
-- AUDIT FIX: Social Core Synchronization & Dead Code Removal
-- ═══════════════════════════════════════════════════════════════════

-- 1. Remove Dead Code (likes table)
-- We use 'post_votes' (up/down) instead of binary likes.
DROP TABLE IF EXISTS public.likes CASCADE;

-- 2. Consolidate Repost Columns & Fix Hot Score Function
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
    
    -- Using the consolidated 'reposts_count' and 'comments_count'
    NEW.hot_score := ((NEW.reposts_count * 25) + (NEW.comments_count * 13) + (v_upvotes - v_downvotes)) / POWER((age_hours + 2), 1.5);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Implement Comments Counter Trigger
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_comments_count ON public.comments;
CREATE TRIGGER tr_update_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- 4. Audit Vote Triggers (Ensure they are robust)
CREATE OR REPLACE FUNCTION public.update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.vote_type = 1 THEN
      UPDATE public.posts SET upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
    ELSE
      UPDATE public.posts SET downvote_count = downvote_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.vote_type = 1 AND NEW.vote_type = -1 THEN
      UPDATE public.posts SET upvote_count = upvote_count - 1, downvote_count = downvote_count + 1 WHERE id = NEW.post_id;
    ELSIF OLD.vote_type = -1 AND NEW.vote_type = 1 THEN
      UPDATE public.posts SET downvote_count = downvote_count - 1, upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.vote_type = 1 THEN
      UPDATE public.posts SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = OLD.post_id;
    ELSE
      UPDATE public.posts SET downvote_count = GREATEST(0, downvote_count - 1) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_post_vote_counts ON public.post_votes;
CREATE TRIGGER tr_update_post_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.post_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_vote_counts();

-- 5. Trigger to recalculate hot score on any counter update
CREATE OR REPLACE FUNCTION public.retrigger_hot_score()
RETURNS TRIGGER AS $$
BEGIN
  -- This will fire tr_calculate_hot_score (BEFORE UPDATE)
  NEW.hot_score := 0; -- Dummy set to trigger the BEFORE UPDATE logic
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_retrigger_hot_score ON public.posts;
CREATE TRIGGER tr_retrigger_hot_score
  BEFORE UPDATE OF upvote_count, downvote_count, comments_count, reposts_count ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.calculate_hot_score(); -- We can just call the function directly
