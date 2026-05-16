-- =============================================================================
-- SETX 360 — Phase 4: Bridge Moderation Trigger
-- Fires the Guardian AI edge function automatically whenever a new item
-- is inserted into bridge_items by the 360-bridge-receiver.
-- Guardian AI will update moderation_status from 'pending_moderation'
-- to either 'live' or 'flagged'.
-- =============================================================================

-- NOTE: In Supabase, database webhooks are configured via the Dashboard UI:
--   Dashboard → Database → Webhooks → Create Webhook
--   Table:   public.bridge_items
--   Events:  INSERT
--   URL:     https://{project-ref}.supabase.co/functions/v1/guardian-ai
--   Method:  POST
--   Headers: Authorization: Bearer {service_role_key}
--
-- The SQL below adds a helper function and a fallback trigger that uses
-- pg_net (Supabase's HTTP extension) to fire the webhook from the DB layer
-- directly — useful if the Dashboard webhook is not yet configured.

-- 1. Enable pg_net extension if not already available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Bridge Moderation Trigger Function (fires Guardian AI via HTTP)
CREATE OR REPLACE FUNCTION public.trigger_guardian_ai_for_bridge_items()
RETURNS TRIGGER AS $$
DECLARE
    v_function_url  TEXT;
    v_service_key   TEXT;
    v_payload       JSONB;
BEGIN
    -- Build the Edge Function URL
    v_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/guardian-ai';

    -- Build the payload matching the Guardian AI expected format
    v_payload := jsonb_build_object(
        'type',   TG_OP,
        'table',  TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', row_to_json(NEW)::jsonb
    );

    -- Fire async HTTP POST to guardian-ai function via pg_net
    -- This is non-blocking — the DB commit does not wait for AI response
    PERFORM extensions.http_post(
        url     := v_function_url,
        body    := v_payload::text,
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to bridge_items INSERT
DROP TRIGGER IF EXISTS trg_bridge_items_guardian_ai ON public.bridge_items;
CREATE TRIGGER trg_bridge_items_guardian_ai
    AFTER INSERT ON public.bridge_items
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_guardian_ai_for_bridge_items();

-- =============================================================================
-- IMPORTANT: Set these Supabase config variables in the SQL editor:
--   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOURREF.supabase.co';
--   ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJ...YOUR_SERVICE_ROLE_KEY...';
-- These are safe to store here — they are DB-level settings, not in migrations.
-- =============================================================================

-- 4. Helper index to efficiently query pending items (for admin moderation dashboard)
CREATE INDEX IF NOT EXISTS idx_bridge_items_pending_mod
    ON public.bridge_items (created_at DESC)
    WHERE moderation_status = 'pending_moderation';
