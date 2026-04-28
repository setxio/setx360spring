-- ========================================================
-- E CITY: DISCOVERY SUITE INFRASTRUCTURE
-- Adding Geospatial support and RSVP system
-- ========================================================

-- 1. ADD COORDINATES TO STORES & POSTS
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS lat FLOAT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS lng FLOAT;

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS lat FLOAT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS lng FLOAT;

-- 2. CREATE RSVP SYSTEM
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'interested')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- 3. ENABLE RLS FOR RSVPS
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- 4. RSVP POLICIES
CREATE POLICY "RSVPs are viewable by everyone" ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can manage own RSVPs" ON public.event_rsvps FOR ALL USING (auth.uid() = user_id);

-- 5. SEARCH RPC (Unified Search across multiple tables)
-- This function allows searching posts, profiles, products, and stores in one go.
CREATE OR REPLACE FUNCTION public.global_search(search_query TEXT)
RETURNS JSONB AS $$
DECLARE
  results JSONB;
BEGIN
  SELECT jsonb_build_object(
    'posts', (
      SELECT jsonb_agg(p) FROM (
        SELECT id, content, type, created_at 
        FROM public.posts 
        WHERE content ILIKE '%' || search_query || '%'
        LIMIT 5
      ) p
    ),
    'profiles', (
      SELECT jsonb_agg(pr) FROM (
        SELECT id, name, avatar_url, role 
        FROM public.profiles 
        WHERE name ILIKE '%' || search_query || '%'
        LIMIT 5
      ) pr
    ),
    'stores', (
      SELECT jsonb_agg(s) FROM (
        SELECT id, name, description, image_url 
        FROM public.stores 
        WHERE name ILIKE '%' || search_query || '%' OR description ILIKE '%' || search_query || '%'
        LIMIT 5
      ) s
    ),
    'products', (
      SELECT jsonb_agg(pd) FROM (
        SELECT id, name, description, price, image_urls 
        FROM public.products 
        WHERE name ILIKE '%' || search_query || '%' OR description ILIKE '%' || search_query || '%'
        LIMIT 5
      ) pd
    )
  ) INTO results;
  
  RETURN results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';
