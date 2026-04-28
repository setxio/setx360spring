-- Add show_address column to stores table
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS show_address BOOLEAN DEFAULT TRUE;
