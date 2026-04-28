-- SETX Custom Per-User Fees Overrides

-- Add custom fee columns to the profiles table
-- By defaulting to NULL, the application knows to fall back to global platform_settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_fee_percentage DECIMAL(5,4) DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_base_fee DECIMAL(12,2) DEFAULT NULL;

-- Example of how the application will use this:
-- COALESCE(profile.custom_fee_percentage, platform_settings.vendor_fee_percentage)
