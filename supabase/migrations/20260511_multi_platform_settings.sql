-- 20260511_multi_platform_settings.sql
-- Expanding platform_settings to support multiple distinct platforms (SETX 360 and SETX.IO)

-- 1. Remove restrictive single-row constraints
ALTER TABLE public.platform_settings DROP CONSTRAINT IF EXISTS platform_settings_id_check;
ALTER TABLE public.platform_settings DROP CONSTRAINT IF EXISTS single_row;

-- 2. Add identification and public key columns
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS platform_name TEXT;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS platform_public_key TEXT;

-- 3. Initialize existing 360 platform data
UPDATE public.platform_settings 
SET 
    slug = 'setx360', 
    platform_name = 'SETX 360 Marketplace',
    platform_public_key = 'pk_test_TYooMQauvdEDq54NiTphI7jx' -- Placeholder test key
WHERE id = 1;

-- 4. Provision SETX.IO infrastructure settings
INSERT INTO public.platform_settings (id, slug, platform_name, vendor_fee_percentage, driver_fee_percentage, platform_public_key)
VALUES (2, 'setxio', 'SETX.IO Partner CSM', 0.0500, 0.0500, 'pk_test_placeholder_io')
ON CONFLICT (slug) DO NOTHING;

-- 5. Extend partner_csm_tenants to associate with a specific platform
ALTER TABLE public.partner_csm_tenants ADD COLUMN IF NOT EXISTS platform_slug TEXT REFERENCES public.platform_settings(slug) DEFAULT 'setx360';

-- 6. Update existing tenants to default platform
UPDATE public.partner_csm_tenants SET platform_slug = 'setx360' WHERE platform_slug IS NULL;

-- 5. Update RLS policies to ensure transparency
-- No changes needed to policies as they already allow read for all and update for admins.
