-- Migration: Premium Ads and Credit Economy
-- Implements lifetime credits, monthly free ads, and tiered ad pricing.

-- 1. Update Profiles with ad tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ad_credits INT DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_free_ad_at TIMESTAMPTZ;

-- 2. Update Ads with priority and duration
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0; -- 100 for Premium, 0 for Free
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ad_type TEXT DEFAULT 'free' CHECK (ad_type IN ('free', 'premium'));

-- 3. Logic to handle ad creation (checks credits or monthly allowance)
CREATE OR REPLACE FUNCTION can_post_free_ad(p_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_credits INT;
    v_last_free TIMESTAMPTZ;
BEGIN
    SELECT ad_credits, last_free_ad_at INTO v_credits, v_last_free FROM public.profiles WHERE id = p_id;
    
    -- Option A: Has lifetime credits
    IF v_credits > 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Option B: Free monthly ad (if 30 days passed since last free ad)
    IF v_last_free IS NULL OR v_last_free < (NOW() - INTERVAL '30 days') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Seed: Ensure all existing users have at least 10 credits
UPDATE public.profiles SET ad_credits = 10 WHERE ad_credits IS NULL OR ad_credits < 1;
