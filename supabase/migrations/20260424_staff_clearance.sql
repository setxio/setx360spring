-- Staff Clearance Table
-- Allows residents to manage professional entities
CREATE TABLE IF NOT EXISTS public.staff_clearance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL, -- store_id or primary_official_id
  entity_type TEXT NOT NULL CHECK (entity_type IN ('business', 'civic', 'ministry', 'creator')),
  clearance_level TEXT DEFAULT 'worker' CHECK (clearance_level IN ('manager', 'worker')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, entity_id)
);

-- RLS
ALTER TABLE public.staff_clearance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clearances" 
ON public.staff_clearance FOR SELECT 
USING (auth.uid() = profile_id);

CREATE POLICY "Business owners can manage staff" 
ON public.staff_clearance FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE id = entity_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Officials can manage their own team" 
ON public.staff_clearance FOR ALL 
USING (
  auth.uid() = entity_id AND entity_type = 'civic'
);

-- Re-sync schema
NOTIFY pgrst, 'reload schema';
