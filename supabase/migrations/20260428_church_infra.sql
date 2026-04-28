-- Church Infrastructure Migration
-- Adds membership tracking and church metadata

-- 1. Create church_members table
CREATE TABLE IF NOT EXISTS public.church_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'leader', 'staff')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(church_id, user_id)
);

-- 2. Add metadata columns to profiles for churches
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS denomination TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_times JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS live_stream_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_stream_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tithe_url TEXT;

-- 3. Enable RLS
ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;

-- 4. Policies for church_members
CREATE POLICY "Anyone can view church members" 
ON public.church_members FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own memberships" 
ON public.church_members FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Churches can manage their members" 
ON public.church_members FOR ALL 
USING (auth.uid() = church_id);
