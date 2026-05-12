-- =============================================================================
-- SETX.IO — Merchant (Store) Provisioning Bridge
-- Fixing the mismatch: The code uses 'stores', but previous migrations used 'sites'.
-- This migration ensures 'stores' has the necessary bridge columns and trigger.
-- =============================================================================

-- 1. Add bridge columns to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS setx360_profile_id  UUID;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS setx360_store_id     UUID;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS setx360_tenant_id    UUID;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS setx360_api_key      TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS setx360_synced_at    TIMESTAMPTZ;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS setx360_sync_status  TEXT DEFAULT 'pending'
    CHECK (setx360_sync_status IN ('pending', 'synced', 'failed', 'not_required'));

-- Add zip_code if it doesn't exist
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- 2. Provisioning trigger function for STORES
CREATE OR REPLACE FUNCTION public.trigger_store_setx360_provisioning()
RETURNS TRIGGER AS $$
DECLARE
    v_provision_url TEXT;
    v_service_key   TEXT;
    v_payload       JSONB;
    v_owner_email   TEXT;
BEGIN
    -- Only fire if this store doesn't already have a SETX 360 identity
    IF NEW.setx360_tenant_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Get owner email from profiles
    SELECT email INTO v_owner_email FROM public.profiles WHERE id = NEW.owner_id;

    v_provision_url := current_setting('app.settings.setx360_url', true) || '/functions/v1/provision-from-setxio';
    v_service_key   := current_setting('app.settings.setx360_service_key', true);

    IF v_provision_url IS NULL OR v_service_key IS NULL THEN
        -- Fallback to hardcoded dev values if settings not set
        v_provision_url := 'https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/provision-from-setxio';
        -- Note: v_service_key MUST be set in app settings for security
    END IF;

    IF v_service_key IS NULL THEN
        RAISE WARNING 'SETX 360 service key not configured. Skipping auto-provisioning for store: %', NEW.id;
        RETURN NEW;
    END IF;

    -- Build the provisioning payload
    v_payload := jsonb_build_object(
        'site_id',            NEW.id,
        'site_name',          COALESCE(NEW.name, NEW.id::TEXT),
        'tenant_slug',        LOWER(REGEXP_REPLACE(COALESCE(NEW.name, NEW.id::TEXT), '[^a-zA-Z0-9]', '-', 'g')),
        'owner_email',        v_owner_email,
        'subscription_plan',  COALESCE(NEW.subscription_tier, 'free'),
        'base_url',           'https://' || LOWER(REGEXP_REPLACE(COALESCE(NEW.name, 'site'), '[^a-zA-Z0-9]', '-', 'g')) || '.setx.io',
        'stripe_account_id',  NEW.stripe_account_id,
        'source',             'setxio_signup'
    );

    -- Fire async HTTP POST to SETX 360 (non-blocking)
    PERFORM extensions.http_post(
        url     := v_provision_url,
        body    := v_payload::text,
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || v_service_key
        )
    );

    RAISE LOG 'SETX 360 provisioning triggered for store: % (%)', NEW.name, NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to stores INSERT
DROP TRIGGER IF EXISTS trg_stores_setx360_provisioning ON public.stores;
CREATE TRIGGER trg_stores_setx360_provisioning
    AFTER INSERT ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_store_setx360_provisioning();
