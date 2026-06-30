-- Migration: Add payment handles to gig worker profiles
ALTER TABLE public.gig_worker_profiles
ADD COLUMN IF NOT EXISTS cash_app_handle TEXT,
ADD COLUMN IF NOT EXISTS zelle_handle TEXT;
