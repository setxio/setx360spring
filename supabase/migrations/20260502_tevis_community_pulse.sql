-- Add RPC function for Tevis to get trending posts
CREATE OR REPLACE FUNCTION public.get_trending_community_pulse(limit_count INT DEFAULT 10)
RETURNS TABLE (
    id UUID,
    type TEXT,
    content TEXT,
    upvotes INT,
    comments_count INT,
    views INT,
    created_at TIMESTAMPTZ,
    engagement_score INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.type, 
        p.content, 
        COALESCE(p.upvotes, 0) as upvotes, 
        COALESCE(p.comments_count, 0) as comments_count, 
        COALESCE(p.views, 0) as views, 
        p.created_at,
        (COALESCE(p.upvotes, 0) * 2 + COALESCE(p.comments_count, 0) * 3 + COALESCE(p.views, 0)) as engagement_score
    FROM public.posts p
    WHERE p.created_at > NOW() - INTERVAL '7 days'
    AND (p.is_nsfw IS FALSE OR p.is_nsfw IS NULL)
    ORDER BY engagement_score DESC
    LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_trending_community_pulse(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_community_pulse(INT) TO service_role;
