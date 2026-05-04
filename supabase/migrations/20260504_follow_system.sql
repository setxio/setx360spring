-- Migration: Follow System with Privacy and Weighting
-- Enables users to follow each other, with customizable influence weights and privacy settings.

-- 1. Create Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    weight INT DEFAULT 1 CHECK (weight >= 1 AND weight <= 10), -- Authority/Interest weight
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- 2. Add Privacy Settings to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_following BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_followers BOOLEAN DEFAULT TRUE;

-- 3. Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their own follows" ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- 5. Helper Function to get follow counts
CREATE OR REPLACE FUNCTION get_follow_stats(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    follower_count INT;
    following_count INT;
BEGIN
    SELECT COUNT(*) INTO follower_count FROM public.follows WHERE following_id = user_id;
    SELECT COUNT(*) INTO following_count FROM public.follows WHERE follower_id = user_id;
    
    RETURN jsonb_build_object(
        'followers', follower_count,
        'following', following_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
