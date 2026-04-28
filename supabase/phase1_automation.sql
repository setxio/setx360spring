-- ═══════════════════════════════════════════════════════════════════
-- PHASE 1: BACKEND AUTOMATION MIGRATION
-- Deployed: 2026-04-21
-- Components: Geo Tagging, Veto Protocol, Post-to-Vendor Bridge
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1.1: POST GEOGRAPHIC TAGGING (verify & backfill)
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_community TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_county TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_state TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_country TEXT;

CREATE OR REPLACE FUNCTION public.sync_post_author_geography()
RETURNS TRIGGER AS $$
BEGIN
    SELECT community, county, state, country 
    INTO NEW.author_community, NEW.author_county, NEW.author_state, NEW.author_country
    FROM public.profiles WHERE id = NEW.profile_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_post_author_geography ON public.posts;
CREATE TRIGGER tr_sync_post_author_geography
BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.sync_post_author_geography();

-- Backfill
UPDATE public.posts p
SET author_community = pr.community,
    author_county = pr.county,
    author_state = pr.state,
    author_country = pr.country
FROM public.profiles pr
WHERE p.profile_id = pr.id AND p.author_community IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_author_community ON public.posts(author_community);
CREATE INDEX IF NOT EXISTS idx_posts_author_county ON public.posts(author_county);
CREATE INDEX IF NOT EXISTS idx_posts_author_state ON public.posts(author_state);

-- ───────────────────────────────────────────────────────────────────
-- 1.3: VETO PROTOCOL (Auto-Approve Ads & Verifications)
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS is_auto_approve_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS auto_approve_hours INT DEFAULT 24;

CREATE OR REPLACE FUNCTION public.auto_approve_stale_ads()
RETURNS void AS $$
BEGIN
  UPDATE public.ads 
  SET status = 'active', updated_at = NOW()
  WHERE status = 'pending' 
    AND created_at < NOW() - INTERVAL '24 hours';
    
  UPDATE public.verifications
  SET status = 'approved'
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '72 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To schedule (requires pg_cron extension enabled):
-- SELECT cron.schedule('auto_approve_stale_content', '0 * * * *', 'SELECT public.auto_approve_stale_ads()');

-- ───────────────────────────────────────────────────────────────────
-- 1.4: POST-TO-VENDOR KEYWORD BRIDGE
-- ───────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_buying_intent()
RETURNS TRIGGER AS $$
DECLARE
  post_text TEXT;
  matched_store RECORD;
  suggestion_msg TEXT;
  bot_id UUID;
BEGIN
  -- Get the first admin as the bot user
  SELECT id INTO bot_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  IF bot_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Don't reply to our own bot posts
  IF NEW.profile_id = bot_id THEN
    RETURN NEW;
  END IF;
  
  post_text := LOWER(NEW.content);
  
  -- Check for buying intent keywords
  IF post_text ~ '(looking for|need a|need an|where can i find|anyone know a|recommend a|who sells|where to buy|where to get|can anyone suggest|does anyone know a|hiring a|want to hire)' THEN
    
    -- Search stores in the same geographic notch
    SELECT s.id, s.name, s.category, s.location
    INTO matched_store
    FROM public.stores s
    JOIN public.profiles p ON s.owner_id = p.id
    WHERE (s.status IS NULL OR s.status = 'active')
      AND (
        post_text LIKE '%' || LOWER(COALESCE(s.category, '')) || '%'
        OR post_text LIKE '%' || LOWER(s.name) || '%'
      )
      AND (
        p.community = NEW.author_community
        OR p.county = NEW.author_county 
        OR p.state = NEW.author_state
      )
    LIMIT 1;
    
    IF matched_store IS NOT NULL THEN
      suggestion_msg := '🤖 A local business might help: ' || matched_store.name || ' (' || COALESCE(matched_store.category, 'retail') || ') — check them out in the Market tab!';
      
      INSERT INTO public.comments (post_id, profile_id, content)
      VALUES (NEW.id, bot_id, suggestion_msg);
      
      UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_buying_intent ON public.posts;
CREATE TRIGGER tr_check_buying_intent
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.check_buying_intent();

-- ───────────────────────────────────────────────────────────────────
-- FINALIZE
-- ───────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
