-- ========================================================
-- SETX360: MARKETPLACE TRUST MIGRATION (PHASE 1)
-- Reviews, Ratings, and Trust Aggregations
-- ========================================================

-- 1. ENHANCE PRODUCTS TABLE
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS avg_rating NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- 2. CREATE PRODUCT REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, profile_id)
);

-- 3. AUTO-CALCULATE AGGREGATES
CREATE OR REPLACE FUNCTION public.update_product_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
    UPDATE public.products
    SET 
      avg_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.product_reviews
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      ),
      review_count = (
        SELECT COUNT(*)
        FROM public.product_reviews
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for reviews
DROP TRIGGER IF EXISTS tr_on_review_change ON public.product_reviews;
CREATE TRIGGER tr_on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_product_rating_stats();

-- 4. RLS POLICIES
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage own reviews" ON public.product_reviews FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
