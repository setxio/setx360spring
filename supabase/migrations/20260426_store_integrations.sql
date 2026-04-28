-- Add integration settings to stores table
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS integration_type TEXT; -- 'shopify', 'woocommerce', 'none'
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS integration_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;
