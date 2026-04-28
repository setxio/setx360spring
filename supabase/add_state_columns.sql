-- Add state and state_abbr columns to zip_to_city_location_mapping
ALTER TABLE public.zip_to_city_location_mapping 
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS state_abbr TEXT;

-- Backfill existing Texas records if they are missing state info
UPDATE public.zip_to_city_location_mapping
SET 
  state = 'Texas',
  state_abbr = 'TX'
WHERE 
  (state IS NULL OR state = '')
  AND (state_abbr IS NULL OR state_abbr = '');
