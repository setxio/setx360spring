-- Phase 3 Schema Updates for Classifieds
-- Add specific detail columns for Vehicles and Real Estate

ALTER TABLE public.classified_items
ADD COLUMN IF NOT EXISTS vehicle_details jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS real_estate_details jsonb DEFAULT '{}'::jsonb;

-- Note: Properties/Real Estate will utilize the existing latitude and longitude columns
-- that were added in Phase 2 for map plotting.
