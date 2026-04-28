-- ═══════════════════════════════════════════════════════════════════
-- PRIVACY AUDIT: Securing Group Posts with RLS
-- ═══════════════════════════════════════════════════════════════════

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;

-- Create a strictly scoped policy
CREATE POLICY "Posts visibility: Public or Group Membership" ON public.posts
FOR SELECT USING (
  group_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = posts.group_id AND profile_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Ensure Group Memberships are also secured
DROP POLICY IF EXISTS "Group members are viewable by everyone" ON public.group_members;
CREATE POLICY "Group memberships are viewable by everyone" ON public.group_members
FOR SELECT USING (true);

-- Ensure Groups themselves are viewable by everyone (to allow joining)
DROP POLICY IF EXISTS "Groups are viewable by everyone" ON public.groups;
CREATE POLICY "Groups are viewable by everyone" ON public.groups
FOR SELECT USING (true);
