-- Fix Group Members RLS Policies
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group memberships are viewable by everyone" ON public.group_members;
CREATE POLICY "Group memberships are viewable by everyone" ON public.group_members 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups" ON public.group_members 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update own membership" ON public.group_members;
CREATE POLICY "Users can update own membership" ON public.group_members 
FOR UPDATE TO authenticated USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Admins can manage group members" ON public.group_members;
CREATE POLICY "Admins can manage group members" ON public.group_members 
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_members.group_id 
    AND profile_id = auth.uid() 
    AND role = 'admin'
  )
);
