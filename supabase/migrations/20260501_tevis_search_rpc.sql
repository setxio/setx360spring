-- Unified Search for Tevis AI (Phase 1)
-- Provides keyword search across posts and events, and categorized business directory access.

-- 1. Search Platform Content (Posts & Events)
CREATE OR REPLACE FUNCTION public.search_platform_content(search_query TEXT, limit_count INT DEFAULT 10)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    content TEXT,
    location TEXT,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    (
        SELECT p.id, 'post' as type, NULL as title, p.content, p.event_location as location, p.created_at
        FROM public.posts p
        WHERE p.content ILIKE '%' || search_query || '%'
        AND (p.is_nsfw IS FALSE OR p.is_nsfw IS NULL)
        LIMIT limit_count
    )
    UNION ALL
    (
        SELECT e.id, 'event' as type, e.title, e.description as content, e.location, e.created_at
        FROM public.events e
        WHERE (e.title ILIKE '%' || search_query || '%' OR e.description ILIKE '%' || search_query || '%')
        AND e.is_public IS TRUE
        LIMIT limit_count
    );
END;
$$;

-- 2. Get Active Businesses
CREATE OR REPLACE FUNCTION public.get_active_businesses(search_category TEXT DEFAULT NULL, limit_count INT DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    address TEXT,
    city TEXT,
    zip TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.description, s.category, s.subcategory, s.address, s.city, s.zip
    FROM public.stores s
    WHERE (search_category IS NULL OR s.category ILIKE '%' || search_category || '%' OR s.subcategory ILIKE '%' || search_category || '%')
    LIMIT limit_count;
END;
$$;

-- Grant access to authenticated users and the service role (for edge functions)
GRANT EXECUTE ON FUNCTION public.search_platform_content(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_platform_content(TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_active_businesses(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_businesses(TEXT, INT) TO service_role;
