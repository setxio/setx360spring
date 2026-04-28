-- SETX Per-Store Refund Policy

-- Add refund configuration to the stores table
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_refunds_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS refund_window_days INT DEFAULT 30;

-- Comment for developer clarity:
-- These columns allow vendors to override the global platform policy for their specific store.
