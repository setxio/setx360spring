-- SETX 360 MASTER CONSOLIDATION SCRIPT
-- RUN THIS ON YOUR ORIGINAL SUPABASE DATABASE TO ENABLE ALL SETX 360 FEATURES

-- 1. ENHANCE PROFILES TABLE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS on_faith_wall BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS denomination TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_times JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS live_stream_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_stream_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tithe_url TEXT;

-- 2. ENHANCE STORES TABLE
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS county TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS address TEXT;

-- 3. CREATE CHURCH MEMBERSHIP SYSTEM
CREATE TABLE IF NOT EXISTS public.church_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'leader', 'staff')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(church_id, user_id)
);
ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;

-- 4. CREATE ENGAGEMENT SYSTEM (VOTES & BOOKMARKS)
CREATE TABLE IF NOT EXISTS public.post_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote_type INT NOT NULL CHECK (vote_type IN (1, -1)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, post_id)
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR NEW TABLES
DO $$ BEGIN
    CREATE POLICY "Anyone can view church members" ON public.church_members FOR SELECT USING (true);
    CREATE POLICY "Users can manage own memberships" ON public.church_members FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "Anyone can view votes" ON public.post_votes FOR SELECT USING (true);
    CREATE POLICY "Users can vote" ON public.post_votes FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = profile_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. HOT SCORE LOGIC (FOR TRENDING FEEDS)
-- Assumes posts table exists with engagement count columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hot_score FLOAT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS upvote_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS downvote_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS repost_count INT DEFAULT 0;

CREATE OR REPLACE FUNCTION calculate_hot_score()
RETURNS TRIGGER AS $$
DECLARE
    age_hours FLOAT;
BEGIN
    age_hours := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 3600;
    NEW.hot_score := ((COALESCE(NEW.repost_count, 0) * 25) + (COALESCE(NEW.comments_count, 0) * 13) + (COALESCE(NEW.upvote_count, 0) - COALESCE(NEW.downvote_count, 0))) / POWER((age_hours + 2), 1.5);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_hot_score ON public.posts;
CREATE TRIGGER tr_update_hot_score
BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION calculate_hot_score();
