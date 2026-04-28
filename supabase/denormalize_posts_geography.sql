-- DENORMALIZE POSTS GEOGRAPHY
-- Goal: Fix complex filtering errors by putting author geography directly on posts.
-- Date: 2026-04-21

-- 1. ADD COLUMNS
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS author_community TEXT,
ADD COLUMN IF NOT EXISTS author_county TEXT,
ADD COLUMN IF NOT EXISTS author_state TEXT,
ADD COLUMN IF NOT EXISTS author_country TEXT;

-- 2. CREATE SYNC TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.sync_post_author_geography()
RETURNS TRIGGER AS $$
BEGIN
    SELECT 
        community, county, state, country 
    INTO 
        NEW.author_community, NEW.author_county, NEW.author_state, NEW.author_country
    FROM public.profiles 
    WHERE id = NEW.profile_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. APPLY TRIGGER
DROP TRIGGER IF EXISTS tr_sync_post_author_geography ON public.posts;
CREATE TRIGGER tr_sync_post_author_geography
BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.sync_post_author_geography();

-- 4. BACKFILL DATA
UPDATE public.posts p
SET 
    author_community = pr.community,
    author_county = pr.county,
    author_state = pr.state,
    author_country = pr.country
FROM public.profiles pr
WHERE p.profile_id = pr.id
AND p.author_community IS NULL;

-- 5. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_posts_author_community ON public.posts(author_community);
CREATE INDEX IF NOT EXISTS idx_posts_author_county ON public.posts(author_county);
CREATE INDEX IF NOT EXISTS idx_posts_author_state ON public.posts(author_state);
CREATE INDEX IF NOT EXISTS idx_posts_author_country ON public.posts(author_country);

-- 6. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
