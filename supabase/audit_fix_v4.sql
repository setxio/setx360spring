-- ═══════════════════════════════════════════════════════════════════
-- AUDIT FIX: Automated Geographic Metadata
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.populate_post_geo_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_profile RECORD;
BEGIN
  -- Fetch user profile info
  SELECT state, county, community, country INTO v_profile 
  FROM public.profiles WHERE id = NEW.profile_id;
  
  -- Auto-fill geographic metadata for notch-zoom filtering
  NEW.author_state := COALESCE(NEW.author_state, v_profile.state);
  NEW.author_county := COALESCE(NEW.author_county, v_profile.county);
  NEW.author_community := COALESCE(NEW.author_community, v_profile.community);
  NEW.author_country := COALESCE(NEW.author_country, v_profile.country);
  
  -- Set default visibility_scope if missing
  NEW.visibility_scope := COALESCE(NEW.visibility_scope, 'city');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_populate_post_geo ON public.posts;
CREATE TRIGGER tr_populate_post_geo
  BEFORE INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.populate_post_geo_metadata();

-- ═══════════════════════════════════════════════════════════════════
-- AUDIT FIX: Post Visibility Defaults
-- ═══════════════════════════════════════════════════════════════════

-- Ensure all posts have a scope to prevent being hidden in notch-zoom
UPDATE public.posts SET visibility_scope = 'city' WHERE visibility_scope IS NULL;
ALTER TABLE public.posts ALTER COLUMN visibility_scope SET DEFAULT 'city';
