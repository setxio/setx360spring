-- Migration: Merchant Performance & Algorithmic Boosts
-- Implements vendor tracking metrics and algorithmic prioritisation for premium content.

-- 1. Merchant Performance Indicators
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS response_time_hours FLOAT DEFAULT 24;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS fulfillment_rate FLOAT DEFAULT 100;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS trust_score INT DEFAULT 85; -- 1-100 base score

-- 2. Enhanced Hot Score with Priority Boosting
-- This boosts posts that have been manually prioritised by admins or premium ad payments.
CREATE OR REPLACE FUNCTION calculate_hot_score()
RETURNS TRIGGER AS $$
DECLARE
    age_hours FLOAT;
    upvotes INT;
    downvotes INT;
    boost_multiplier FLOAT DEFAULT 1.0;
BEGIN
    upvotes := COALESCE(NEW.upvote_count, 0);
    downvotes := COALESCE(NEW.downvote_count, 0);
    age_hours := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 3600;
    
    -- Apply Priority Boost (Admin/Premium)
    -- Priority 100+ gets a significant algorithmic boost
    IF COALESCE(NEW.priority, 0) >= 100 THEN
        boost_multiplier := 2.5;
    ELSIF COALESCE(NEW.priority, 0) > 0 THEN
        boost_multiplier := 1.5;
    END IF;

    NEW.hot_score := (((COALESCE(NEW.repost_count, 0) * 25) + (COALESCE(NEW.comments_count, 0) * 13) + (upvotes - downvotes)) / POWER((age_hours + 2), 1.5)) * boost_multiplier;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Sync Existing Scores
UPDATE public.posts SET hot_score = hot_score WHERE priority > 0;
