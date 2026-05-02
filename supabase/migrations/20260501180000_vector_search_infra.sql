-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector
WITH SCHEMA public;

-- Add embedding columns to posts and events tables
-- We use 768 dimensions because Gemini text-embedding-004 outputs 768-dimensional vectors
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create HNSW indexes for fast approximate nearest neighbor search
-- HNSW is recommended for pgvector over IVFFlat for better recall and performance
CREATE INDEX IF NOT EXISTS posts_embedding_idx ON public.posts USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS events_embedding_idx ON public.events USING hnsw (embedding vector_cosine_ops);

-- Create the semantic search RPC function
CREATE OR REPLACE FUNCTION public.search_platform_content_vector(
    search_query TEXT,
    query_embedding vector(768),
    limit_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    content TEXT,
    location TEXT,
    created_at TIMESTAMPTZ,
    similarity FLOAT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    (
        SELECT 
            p.id, 
            'post' as type, 
            NULL::TEXT as title, 
            p.content, 
            p.event_location as location, 
            p.created_at,
            (1 - (p.embedding <=> query_embedding)) as similarity
        FROM public.posts p
        WHERE 
            (p.is_nsfw IS FALSE OR p.is_nsfw IS NULL)
            AND p.embedding IS NOT NULL
        ORDER BY p.embedding <=> query_embedding
        LIMIT limit_count
    )
    UNION ALL
    (
        SELECT 
            e.id, 
            'event' as type, 
            e.title, 
            e.description as content, 
            e.location, 
            e.created_at,
            (1 - (e.embedding <=> query_embedding)) as similarity
        FROM public.events e
        WHERE 
            e.is_public IS TRUE
            AND e.embedding IS NOT NULL
        ORDER BY e.embedding <=> query_embedding
        LIMIT limit_count
    )
    ORDER BY similarity DESC
    LIMIT limit_count;
END;
$$;

-- Fallback to keyword search if query_embedding is NULL
CREATE OR REPLACE FUNCTION public.search_platform_content_vector_fallback(
    search_query TEXT,
    query_embedding vector(768) DEFAULT NULL,
    limit_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    content TEXT,
    location TEXT,
    created_at TIMESTAMPTZ,
    similarity FLOAT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF query_embedding IS NOT NULL THEN
        RETURN QUERY SELECT * FROM public.search_platform_content_vector(search_query, query_embedding, limit_count);
    ELSE
        RETURN QUERY
        (
            SELECT p.id, 'post' as type, NULL::TEXT as title, p.content, p.event_location as location, p.created_at, 0::FLOAT as similarity
            FROM public.posts p
            WHERE p.content ILIKE '%' || search_query || '%'
            AND (p.is_nsfw IS FALSE OR p.is_nsfw IS NULL)
            LIMIT limit_count
        )
        UNION ALL
        (
            SELECT e.id, 'event' as type, e.title, e.description as content, e.location, e.created_at, 0::FLOAT as similarity
            FROM public.events e
            WHERE (e.title ILIKE '%' || search_query || '%' OR e.description ILIKE '%' || search_query || '%')
            AND e.is_public IS TRUE
            LIMIT limit_count
        )
        ORDER BY created_at DESC
        LIMIT limit_count;
    END IF;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.search_platform_content_vector(TEXT, vector(768), INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_platform_content_vector(TEXT, vector(768), INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_platform_content_vector_fallback(TEXT, vector(768), INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_platform_content_vector_fallback(TEXT, vector(768), INT) TO service_role;
