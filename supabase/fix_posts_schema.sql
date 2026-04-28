-- ========================================================
-- SETX360: COMPREHENSIVE SCHEMA FIX
-- This script ensures Groups exist and upgrades the Posts table.
-- ========================================================

-- 1. CREATE GROUPS INFRASTRUCTURE (Required for Post relations)
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  rules TEXT,
  category TEXT CHECK (category IN ('Faith', 'Recipes', 'Events', 'Hobbies', 'General', 'Community', 'Business', 'Sports')),
  creator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Basic Policies for Groups
DO $$ BEGIN
    DROP POLICY IF EXISTS "Groups are viewable by everyone" ON public.groups;
    CREATE POLICY "Groups are viewable by everyone" ON public.groups FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
    CREATE POLICY "Users can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
    
    DROP POLICY IF EXISTS "Members can view member list" ON public.group_members;
    CREATE POLICY "Members can view member list" ON public.group_members FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- 2. UPGRADE POSTS TABLE
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS original_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS poll_data JSONB;

-- Update the type constraint to include 'repost'
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_type_check CHECK (type IN (
    'post', 'news', 'poll', 'event', 'prayer_request', 
    'bible_verse', 'announcement', 'sale', 'repost',
    'testament', 'bible_question'
));


-- 3. ENSURE ENGAGEMENT COLUMNS EXIST
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS upvote_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS downvote_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS repost_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hot_score FLOAT DEFAULT 0;

-- 4. AUTOMATED SCHEMA REFRESH (Pro-Tip)
-- This command forces PostgREST to immediately refresh its cache
NOTIFY pgrst, 'reload schema';

-- This setup ensures every future structural change triggers a cache refresh automatically.
CREATE OR REPLACE FUNCTION pgrst_watch() RETURNS event_trigger AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;

DROP EVENT TRIGGER IF EXISTS pgrst_watch;
CREATE EVENT TRIGGER pgrst_watch ON ddl_command_end
EXECUTE PROCEDURE pgrst_watch();
