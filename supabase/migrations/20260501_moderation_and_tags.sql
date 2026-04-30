-- 1. EXTEND POSTS TABLE
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_nsfw BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[];

-- 2. EXTEND PROFILES TABLE FOR SUSPENSION
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ DEFAULT NULL;

-- 3. CREATE CONTENT FLAGS TABLE
CREATE TABLE IF NOT EXISTS public.content_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can create flags" ON public.content_flags FOR INSERT WITH CHECK (auth.uid() = reporter_id);
    CREATE POLICY "Admins can view flags" ON public.content_flags FOR SELECT USING (true); -- Replace with actual admin logic if applicable
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. CREATE USER STRIKES TABLE
CREATE TABLE IF NOT EXISTS public.user_strikes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_strikes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view their own strikes" ON public.user_strikes FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. RPC TO INCREMENT POST VIEWS
CREATE OR REPLACE FUNCTION increment_post_views(post_id_val UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.posts
    SET views = COALESCE(views, 0) + 1
    WHERE id = post_id_val;
END;
$$ LANGUAGE plpgsql;
