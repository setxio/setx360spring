-- =============================================================================
-- SETX 360 — Website Builder Phase 4 (Custom Domains)
-- Adds custom_domain column to wb_sites
-- =============================================================================

ALTER TABLE public.wb_sites 
ADD COLUMN IF NOT EXISTS custom_domain text UNIQUE;
