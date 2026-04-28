-- Efutura Age-Based Privacy Infrastructure

-- Ensure profiles has birth date components for filtering
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_month INT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_day INT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_year INT;

-- Indexing for performance on age-based searches
CREATE INDEX IF NOT EXISTS idx_profiles_birth_year ON public.profiles(birth_year);

-- Comment for developer clarity:
-- These columns allow adults to be filtered out of minor searches and vice versa 
-- as part of the Efutura Technologies LLC safety initiative.
