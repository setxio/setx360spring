-- Fix RLS for stores table to allow owners to insert their own stores
DROP POLICY IF EXISTS "Owners can manage own stores" ON public.stores;

CREATE POLICY "Owners can manage own stores" 
ON public.stores 
FOR ALL 
TO authenticated 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Ensure RLS is enabled
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
