-- =============================================================================
-- SETX 360 — Phase 1: Partner CSM Tenant Registry
-- SETX 360 is the Identity Root. Partner CSM nodes (setx.io POS) are tenants.
-- Each tenant has a unique slug, a signed API key, and a Stripe Connected Account.
-- =============================================================================

-- 1. Create the Partner CSM Tenant Registry
CREATE TABLE IF NOT EXISTS public.partner_csm_tenants (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_slug         TEXT        NOT NULL UNIQUE,          -- e.g., 'beaumont-bbq', 'port-arthur-pawn'
    display_name        TEXT        NOT NULL,
    base_url            TEXT        NOT NULL,                  -- e.g., 'https://beaumont-bbq.setx.io'
    api_key_hash        TEXT        NOT NULL,                  -- SHA-256 hash of their API key (never store plaintext)
    stripe_account_id   TEXT,                                  -- Stripe Connect account ID: acct_XXXX
    webhook_endpoint    TEXT        GENERATED ALWAYS AS (base_url || '/api/v1/pos-webhook') STORED,
    status              TEXT        NOT NULL DEFAULT 'active'
                                    CHECK (status IN ('active', 'suspended', 'pending_onboarding')),
    contact_email       TEXT,
    platform_fee_bps    INT         NOT NULL DEFAULT 500,      -- Basis points. 500 = 5%. Override per tenant.
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Extend the stores table to link each store to its CSM tenant node
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS csm_tenant_id UUID REFERENCES public.partner_csm_tenants(id) ON DELETE SET NULL;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS stripe_account_id TEXT; -- Merchant's own Stripe Connected Account

-- 3. Timestamps trigger
CREATE OR REPLACE FUNCTION update_partner_csm_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_partner_csm_tenants_updated_at ON public.partner_csm_tenants;
CREATE TRIGGER trg_partner_csm_tenants_updated_at
    BEFORE UPDATE ON public.partner_csm_tenants
    FOR EACH ROW EXECUTE FUNCTION update_partner_csm_tenants_updated_at();

-- 4. Enable RLS
ALTER TABLE public.partner_csm_tenants ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all tenants
CREATE POLICY "Admins can manage CSM tenants" ON public.partner_csm_tenants
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Authenticated users can read active tenants (needed for SSO redirect lookup)
CREATE POLICY "Authenticated users can view active tenants" ON public.partner_csm_tenants
    FOR SELECT USING (
        auth.role() = 'authenticated' AND status = 'active'
    );

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS idx_partner_csm_tenants_slug   ON public.partner_csm_tenants (tenant_slug);
CREATE INDEX IF NOT EXISTS idx_stores_csm_tenant_id        ON public.stores (csm_tenant_id);

-- =============================================================================
-- RS256 Key Generation Instructions (Manual Step — Cannot Be Automated)
-- =============================================================================
-- Run these commands locally to generate the RSA key pair:
--
--   openssl genrsa -out rs256_private.pem 2048
--   openssl rsa -in rs256_private.pem -pubout -out rs256_public.pem
--
-- Then store the private key in Supabase Vault:
--   Dashboard → Settings → Vault → New Secret
--   Name: RS256_PRIVATE_KEY
--   Value: (paste contents of rs256_private.pem)
--
-- Give the public key (rs256_public.pem) to each Partner CSM node
-- so they can verify inbound JWTs from setx360.
-- =============================================================================
