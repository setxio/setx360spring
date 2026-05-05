-- Add store_id to jobs table to associate jobs with specific establishments
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- Add required_roles to jobs for better candidate matching
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS required_roles TEXT[] DEFAULT '{}';
