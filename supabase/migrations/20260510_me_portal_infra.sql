-- Add Driver Onboarding Fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_application_status text DEFAULT 'none'; -- 'none', 'pending', 'approved', 'rejected'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_application_data jsonb;
