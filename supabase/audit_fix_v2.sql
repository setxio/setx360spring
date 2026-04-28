-- ═══════════════════════════════════════════════════════════════════
-- AUDIT FIX: Integrity Constraints & Naming Consistency
-- ═══════════════════════════════════════════════════════════════════

-- 1. Prevent negative ad credits
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_ad_credits_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_ad_credits_check CHECK (ad_credits >= 0);

-- 2. Consolidate Reposts Column
-- We will use 'reposts_count' as the primary one.
-- If 'repost_count' exists, we'll keep it as an alias for now but start migrating triggers.

-- 3. Sync Counters Trigger for Reposts
CREATE OR REPLACE FUNCTION public.update_post_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts 
    SET reposts_count = reposts_count + 1 
    WHERE id = NEW.original_post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts 
    SET reposts_count = GREATEST(0, reposts_count - 1) 
    WHERE id = OLD.original_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_repost_count ON public.posts;
DROP TRIGGER IF EXISTS tr_update_repost_count_insert ON public.posts;
DROP TRIGGER IF EXISTS tr_update_repost_count_delete ON public.posts;

CREATE TRIGGER tr_update_repost_count_insert
  AFTER INSERT ON public.posts
  FOR EACH ROW
  WHEN (NEW.type = 'repost')
  EXECUTE FUNCTION public.update_post_repost_count();

CREATE TRIGGER tr_update_repost_count_delete
  AFTER DELETE ON public.posts
  FOR EACH ROW
  WHEN (OLD.type = 'repost')
  EXECUTE FUNCTION public.update_post_repost_count();

-- ═══════════════════════════════════════════════════════════════════
-- AUDIT FIX: Geographic Integrity
-- ═══════════════════════════════════════════════════════════════════

-- Ensure visibility_scope has valid values
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_visibility_scope_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_visibility_scope_check 
CHECK (visibility_scope IN ('city', 'county', 'state', 'national'));
