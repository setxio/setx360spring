-- Fix Infinite Recursion in group_members RLS
-- The previous policy was recursively calling itself. 
-- We use a SECURITY DEFINER function to break the recursion.

-- 1. Helper function to check admin status without triggering RLS loops
CREATE OR REPLACE FUNCTION public.is_group_admin(gid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = gid 
    AND profile_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update group_members policies
DROP POLICY IF EXISTS "Admins can manage group members" ON public.group_members;

CREATE POLICY "Group admins can manage members" 
ON public.group_members 
FOR ALL 
TO authenticated 
USING (public.is_group_admin(group_id));

-- 3. Add policy for group creators (from the groups table) to manage members
-- This is a secondary check that looks at the groups table instead of group_members
CREATE POLICY "Group creators can manage members" 
ON public.group_members 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_id 
    AND creator_id = auth.uid()
  )
);

-- 4. Ensure group_members are viewable
DROP POLICY IF EXISTS "Group memberships are viewable by everyone" ON public.group_members;
CREATE POLICY "Group memberships are viewable by everyone" 
ON public.group_members 
FOR SELECT 
USING (true);
