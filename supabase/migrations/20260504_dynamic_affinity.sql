-- Migration: Dynamic Affinity Weighting
-- Implements gradual weight increases based on user interactions (profile visits, lookups).

-- 1. Add interaction score to follows
ALTER TABLE public.follows ADD COLUMN IF NOT EXISTS interaction_score INT DEFAULT 0;

-- 2. Function to log interactions and boost affinity
CREATE OR REPLACE FUNCTION log_social_interaction(actor_id UUID, target_id UUID, boost_amount INT DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    -- Increment the interaction score for the follower-following relationship
    UPDATE public.follows
    SET interaction_score = interaction_score + boost_amount,
        -- Optionally auto-increment the base weight if interactions cross a threshold (e.g., every 50 visits)
        weight = LEAST(10, weight + (CASE WHEN (interaction_score + boost_amount) % 50 = 0 THEN 1 ELSE 0 END))
    WHERE follower_id = actor_id AND following_id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update view to include affinity
-- (Assuming we might want a calculated 'Effective Weight' later)
