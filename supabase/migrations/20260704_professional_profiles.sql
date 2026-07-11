-- Migration for Professional Profiles and Page-Authored Posts

-- 1. Add page_id to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL;

-- 2. Update the detailed_posts view
-- Drop existing view if columns changed significantly, but CREATE OR REPLACE should handle it if columns match or expand.
DROP VIEW IF EXISTS public.detailed_posts;

CREATE OR REPLACE VIEW public.detailed_posts AS
SELECT 
    p.id,
    p.content,
    p.profile_id,
    p.page_id,
    p.created_at,
    p.category,
    p.lat,
    p.lng,
    p.location,
    p.media_urls,
    p.poll_data,
    p.type,
    p.original_post_id,
    p.likes_count,
    p.comments_count,
    p.upvote_count,
    p.downvote_count,
    p.repost_count,
    p.reposts_count,
    p.views,
    p.group_id,
    p.hot_score,
    
    COALESCE(pg.name, pr.name) as author_name,
    COALESCE(pg.avatar_url, pr.avatar_url) as author_avatar,
    
    pr.role as author_role,
    pr.community as author_community,
    pr.county as author_county,
    pr.state as author_state,
    pr.country as author_country,
    pr.is_public as author_is_public

FROM public.posts p
LEFT JOIN public.profiles pr ON p.profile_id = pr.id
LEFT JOIN public.pages pg ON p.page_id = pg.id;
