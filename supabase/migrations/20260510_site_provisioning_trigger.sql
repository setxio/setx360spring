-- =============================================================================
-- setx.io — Site Provisioning Bridge Trigger
-- When a new site (business) is created on setx.io, this trigger automatically:
--   1. Adds columns to sites for storing the SETX 360 bridge identity
--   2. Fires a webhook to SETX 360's provision-from-setxio edge function
--   3. SETX 360 creates the mirror profile + store + tenant record
--   4. SETX 360 returns an API key + tenant_id stored back on this sites row
-- =============================================================================

-- 1. Add SETX 360 bridge columns to the sites table
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS setx360_profile_id  UUID;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS setx360_store_id     UUID;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS setx360_tenant_id    UUID;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS setx360_api_key      TEXT;   -- Stored encrypted in Vault separately; reference only
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS setx360_synced_at    TIMESTAMPTZ;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS setx360_sync_status  TEXT DEFAULT 'pending'
    CHECK (setx360_sync_status IN ('pending', 'synced', 'failed', 'not_required'));

-- Add subscription_plan if it doesn't already exist (defensive)
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free'
    CHECK (subscription_plan IN ('free','starter','pro','enterprise'));
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing'
    CHECK (subscription_status IN ('active','past_due','cancelled','trialing','incomplete'));

-- 2. Provisioning trigger function
--    Fires async HTTP POST to SETX 360 upon site creation
CREATE OR REPLACE FUNCTION public.trigger_setx360_provisioning()
RETURNS TRIGGER AS $$
DECLARE
    v_provision_url TEXT;
    v_service_key   TEXT;
    v_payload       JSONB;
BEGIN
    -- Only fire if this site doesn't already have a SETX 360 identity
    IF NEW.setx360_tenant_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    v_provision_url := current_setting('app.settings.setx360_url', true) || '/functions/v1/provision-from-setxio';
    v_service_key   := current_setting('app.settings.setx360_service_key', true);

    IF v_provision_url IS NULL OR v_service_key IS NULL THEN
        RAISE WARNING 'SETX 360 provisioning URL or service key not configured. Skipping auto-provisioning for site: %', NEW.id;
        RETURN NEW;
    END IF;

    -- Build the provisioning payload
    v_payload := jsonb_build_object(
        'site_id',            NEW.id,
        'site_name',          COALESCE(NEW.name, NEW.id::TEXT),
        'tenant_slug',        LOWER(REGEXP_REPLACE(COALESCE(NEW.name, NEW.id::TEXT), '[^a-zA-Z0-9]', '-', 'g')),
        'owner_email',        NEW.owner_email,
        'subscription_plan',  COALESCE(NEW.subscription_plan, 'free'),
        'base_url',           COALESCE(NEW.domain, 'https://' || LOWER(REGEXP_REPLACE(COALESCE(NEW.name, 'site'), '[^a-zA-Z0-9]', '-', 'g')) || '.setx.io'),
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

    RAISE LOG 'SETX 360 provisioning triggered for site: % (%)', NEW.name, NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to sites INSERT
DROP TRIGGER IF EXISTS trg_sites_setx360_provisioning ON public.sites;
CREATE TRIGGER trg_sites_setx360_provisioning
    AFTER INSERT ON public.sites
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_setx360_provisioning();

-- 4. Subscription sync trigger
--    When a merchant upgrades/downgrades their plan on setx.io,
--    push the new plan to SETX 360 so feature gates update there too.
CREATE OR REPLACE FUNCTION public.trigger_setx360_subscription_sync()
RETURNS TRIGGER AS $$
DECLARE
    v_sync_url    TEXT;
    v_service_key TEXT;
    v_payload     JSONB;
BEGIN
    -- Only fire if the subscription_plan actually changed AND we have a SETX 360 link
    IF NEW.subscription_plan = OLD.subscription_plan AND NEW.subscription_status = OLD.subscription_status THEN
        RETURN NEW;
    END IF;

    IF NEW.setx360_tenant_id IS NULL THEN
        RETURN NEW; -- Not yet provisioned on SETX 360
    END IF;

    v_sync_url    := current_setting('app.settings.setx360_url', true) || '/functions/v1/sync-subscription';
    v_service_key := current_setting('app.settings.setx360_service_key', true);

    v_payload := jsonb_build_object(
        'tenant_id',            NEW.setx360_tenant_id,
        'site_id',              NEW.id,
        'plan',                 NEW.subscription_plan,
        'status',               COALESCE(NEW.subscription_status, 'active'),
        'stripe_customer_id',   NEW.stripe_customer_id,
        'changed_at',           NOW()
    );

    PERFORM extensions.http_post(
        url     := v_sync_url,
        body    := v_payload::text,
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || v_service_key
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sites_subscription_sync ON public.sites;
CREATE TRIGGER trg_sites_subscription_sync
    AFTER UPDATE OF subscription_plan, subscription_status ON public.sites
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_setx360_subscription_sync();

-- =============================================================================
-- IMPORTANT: Set these config vars in the setx.io Supabase SQL editor:
--   ALTER DATABASE postgres SET app.settings.setx360_url = 'https://okulcpbrikcumiomrzuh.supabase.co';
--   ALTER DATABASE postgres SET app.settings.setx360_service_key = 'eyJ...SETX360_SERVICE_ROLE_KEY...';
-- =============================================================================
