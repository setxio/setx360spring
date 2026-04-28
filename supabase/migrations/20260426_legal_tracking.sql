-- SETX Legal Compliance Tracking

-- Add column to track when a user accepted the terms of service
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ;

-- Comment for developer clarity:
-- This allows us to track which version of the terms a user has agreed to and when.
