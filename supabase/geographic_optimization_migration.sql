-- ========================================================
-- UNIFIED GEOGRAPHIC SCOPE OPTIMIZATION (v2)
-- 1. High-Performance Geography Indexes
-- 2. Enhanced Multi-Table Search Engine
-- 3. Geo-Aware Trending Content View
-- ========================================================

-- 1. ADD PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_geography_lookup ON public.profiles (community, county, state, country);
CREATE INDEX IF NOT EXISTS idx_posts_geography_lookup ON public.posts (location);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores (owner_id);

-- 2. ENHANCED SEARCH RPC (Geography Aware)
CREATE OR REPLACE FUNCTION public.global_search(
  search_query TEXT,
  p_scope_type TEXT DEFAULT 'national',
  p_scope_value TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  results JSONB;
BEGIN
  SELECT jsonb_build_object(
    'posts', (
      SELECT jsonb_agg(p) FROM (
        SELECT po.id, po.content, po.type, po.created_at, po.location
        FROM public.posts po
        LEFT JOIN public.profiles pr ON po.profile_id = pr.id
        WHERE po.content ILIKE '%' || search_query || '%'
        AND (
          p_scope_type = 'national' OR p_scope_value IS NULL OR
          (p_scope_type = 'city' AND (po.location = p_scope_value OR pr.community = p_scope_value)) OR
          (p_scope_type = 'county' AND pr.county = p_scope_value) OR
          (p_scope_type = 'state' AND pr.state = p_scope_value)
        )
        LIMIT 10
      ) p
    ),
    'profiles', (
      SELECT jsonb_agg(pr) FROM (
        SELECT id, name, avatar_url, role, community, county, state 
        FROM public.profiles 
        WHERE name ILIKE '%' || search_query || '%'
        AND (
          p_scope_type = 'national' OR p_scope_value IS NULL OR
          (p_scope_type = 'city' AND community = p_scope_value) OR
          (p_scope_type = 'county' AND county = p_scope_value) OR
          (p_scope_type = 'state' AND state = p_scope_value)
        )
        LIMIT 5
      ) pr
    ),
    'stores', (
      SELECT jsonb_agg(s) FROM (
        SELECT st.id, st.name, st.description, st.image_url 
        FROM public.stores st
        LEFT JOIN public.profiles pr ON st.owner_id = pr.id
        WHERE (st.name ILIKE '%' || search_query || '%' OR st.description ILIKE '%' || search_query || '%')
        AND (
          p_scope_type = 'national' OR p_scope_value IS NULL OR
          (p_scope_type = 'city' AND pr.community = p_scope_value) OR
          (p_scope_type = 'county' AND pr.county = p_scope_value) OR
          (p_scope_type = 'state' AND pr.state = p_scope_value)
        )
        LIMIT 5
      ) s
    ),
    'products', (
      SELECT jsonb_agg(pd) FROM (
        SELECT prod.id, prod.name, prod.description, prod.price, prod.image_urls 
        FROM public.products prod
        LEFT JOIN public.stores st ON prod.store_id = st.id
        LEFT JOIN public.profiles pr ON st.owner_id = pr.id
        WHERE (prod.name ILIKE '%' || search_query || '%' OR prod.description ILIKE '%' || search_query || '%')
        AND (
          p_scope_type = 'national' OR p_scope_value IS NULL OR
          (p_scope_type = 'city' AND pr.community = p_scope_value) OR
          (p_scope_type = 'county' AND pr.county = p_scope_value) OR
          (p_scope_type = 'state' AND pr.state = p_scope_value)
        )
        LIMIT 5
      ) pd
    )
  ) INTO results;
  
  RETURN results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GEO-AWARE TRENDING VIEW
CREATE OR REPLACE VIEW public.trending_content AS
SELECT 
    p.id, 
    p.profile_id, 
    p.content, 
    p.created_at, 
    p.hot_score, 
    p.category,
    p.location,
    pr.name as author_name,
    pr.avatar_url as author_avatar,
    pr.community,
    pr.county,
    pr.state,
    pr.country
FROM public.posts p
JOIN public.profiles pr ON p.profile_id = pr.id
WHERE p.created_at > NOW() - INTERVAL '72 hours'
ORDER BY p.hot_score DESC;

-- 4. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
