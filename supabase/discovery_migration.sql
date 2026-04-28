-- ========================================================
-- SETX360: DISCOVERY ALGORITHMS MIGRATION
-- Enhancements for Trending, Hot Deals, and Personalization
-- ========================================================

-- 1. ENHANCE PRODUCTS FOR "HOT DEALS"
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS original_price NUMERIC,
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC GENERATED ALWAYS AS (
    CASE 
        WHEN original_price > 0 AND original_price > price 
        THEN (original_price - price) / original_price * 100 
        ELSE 0 
    END
) STORED,
ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;

-- 2. ENHANCE POSTS FOR "VIBES" (Categorization)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General' 
CHECK (category IN ('Faith', 'Recipes', 'Events', 'Hobbies', 'General', 'Community', 'Business', 'Sports', 'News', 'Tech', 'Deals'));

-- 3. INTERACTION TRACKING for "MY VIBES"
-- This table tracks which categories a user interacts with
CREATE TABLE IF NOT EXISTS public.user_vibe_scores (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (profile_id, category)
);

-- Trigger to update Vibe Scores on Upvote
CREATE OR REPLACE FUNCTION public.update_vibe_on_vote()
RETURNS TRIGGER AS $$
DECLARE
    post_category TEXT;
BEGIN
    -- Only track positive engagement
    IF NEW.vote_type = 1 THEN
        SELECT category INTO post_category FROM public.posts WHERE id = NEW.post_id;
        
        INSERT INTO public.user_vibe_scores (profile_id, category, score)
        VALUES (NEW.user_id, post_category, 1)
        ON CONFLICT (profile_id, category) 
        DO UPDATE SET score = user_vibe_scores.score + 1, last_updated = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_vibe_on_vote ON public.post_votes;
CREATE TRIGGER tr_update_vibe_on_vote
AFTER INSERT ON public.post_votes
FOR EACH ROW EXECUTE FUNCTION public.update_vibe_on_vote();

-- 4. VIEWS FOR AGGREGATED DISCOVERY
CREATE OR REPLACE VIEW public.trending_content AS
SELECT 
    p.id, 
    p.profile_id, 
    p.content, 
    p.created_at, 
    p.hot_score, 
    p.category,
    pr.name as author_name,
    pr.avatar_url as author_avatar
FROM public.posts p
JOIN public.profiles pr ON p.profile_id = pr.id
WHERE p.created_at > NOW() - INTERVAL '72 hours'
ORDER BY p.hot_score DESC;

-- RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
