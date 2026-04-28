-- SETXIO3 Style Admin Extensions
-- 1. Track platform-wide activity
CREATE TABLE IF NOT EXISTS public.platform_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action_type TEXT NOT NULL, -- 'signup', 'post_created', 'store_approved', 'ad_created', 'moderation_action'
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Platform Announcements (for global banner management)
CREATE TABLE IF NOT EXISTS public.platform_announcements (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'emergency'
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add more granular control to profiles if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- 'active', 'frozen', 'banned'

-- 4. Enable RLS and simple policies
ALTER TABLE public.platform_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage activity" ON public.platform_activity
    FOR ALL USING (auth.jwt()->>'email' = 'setxplatform@gmail.com');

CREATE POLICY "Admins can manage announcements" ON public.platform_announcements
    FOR ALL USING (auth.jwt()->>'email' = 'setxplatform@gmail.com');

CREATE POLICY "Everyone can read active announcements" ON public.platform_announcements
    FOR SELECT USING (is_active = true);
