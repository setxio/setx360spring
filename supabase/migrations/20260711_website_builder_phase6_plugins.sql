-- Add plugins_config JSONB column to wb_site_settings to store plugin toggles/settings
ALTER TABLE public.wb_site_settings 
ADD COLUMN IF NOT EXISTS plugins_config JSONB DEFAULT '{}'::jsonb;
