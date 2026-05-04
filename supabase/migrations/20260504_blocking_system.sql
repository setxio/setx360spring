-- Migration: Advanced Blocking and Cool-Down System
-- Enables users to block others permanently or for a 'cool-down' period.
-- Also establishes RLS rules for no-contact and transcript exports.

-- 1. Create Blocks Table
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'permanent' CHECK (type IN ('permanent', 'cooldown')),
    expires_at TIMESTAMPTZ, -- NULL for permanent
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- 2. Enable RLS
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Users can manage their own blocks" ON public.blocks FOR ALL USING (auth.uid() = blocker_id);
CREATE POLICY "Users can see who they have blocked" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id);

-- 4. Global Exclusion Logic (Helper Function)
CREATE OR REPLACE FUNCTION is_blocked(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocks 
        WHERE (blocker_id = user_a AND blocked_id = user_b AND (expires_at IS NULL OR expires_at > NOW()))
           OR (blocker_id = user_b AND blocked_id = user_a AND (expires_at IS NULL OR expires_at > NOW()))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update Message RLS to prevent contact
-- This assumes a 'messages' table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'messages') THEN
        DROP POLICY IF EXISTS "No contact between blocked users" ON public.messages;
        CREATE POLICY "No contact between blocked users" ON public.messages 
        FOR ALL USING (NOT is_blocked(sender_id, recipient_id));
    END IF;
END $$;

-- 6. Update Profile/Post visibility
-- We can add this to existing policies if needed, but for now we'll handle it in queries.
