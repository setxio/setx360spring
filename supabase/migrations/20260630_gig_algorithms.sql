-- Gig Economy Algorithms & Ratings Schema Update

-- 1. Add skills to worker profile
ALTER TABLE public.gig_worker_profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- 2. Create gig_client_reviews
CREATE TABLE IF NOT EXISTS public.gig_client_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(gig_id, reviewer_id)
);

ALTER TABLE public.gig_client_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view client reviews" ON public.gig_client_reviews;
CREATE POLICY "Public can view client reviews" ON public.gig_client_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Workers can create client reviews" ON public.gig_client_reviews;
CREATE POLICY "Workers can create client reviews" ON public.gig_client_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 3. Add client rating to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gig_client_rating NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gig_client_reviews_count INTEGER DEFAULT 0;

-- 4. RPC to safely update a client's rating
CREATE OR REPLACE FUNCTION update_gig_client_rating(p_client_id UUID)
RETURNS void AS $$
DECLARE
    v_avg NUMERIC;
    v_count INTEGER;
BEGIN
    SELECT COALESCE(AVG(rating), 0), COUNT(id)
    INTO v_avg, v_count
    FROM public.gig_client_reviews
    WHERE client_id = p_client_id;
    
    UPDATE public.profiles
    SET gig_client_rating = ROUND(v_avg, 1),
        gig_client_reviews_count = v_count
    WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
