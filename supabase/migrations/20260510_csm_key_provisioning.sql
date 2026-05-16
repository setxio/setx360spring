-- =============================================================================
-- SETX 360 — Automated CSM Tenant API Key Provisioning
-- Uses Supabase Vault directly from PostgreSQL via vault.create_secret()
-- and pgcrypto for SHA-256 hashing — fully automated, zero manual steps.
-- =============================================================================

-- 1. Ensure pgcrypto is available (needed for SHA-256 hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- 2. Secure RPC: Provision a new tenant API key atomically
--    Called by the onboard-csm-tenant Edge Function with service_role credentials.
--    This function:
--      a. Stores the plaintext API key in Supabase Vault under a predictable name
--      b. Computes its SHA-256 hash (for storage in partner_csm_tenants)
--      c. Returns ONLY the hash — plaintext stays in Vault, never in app tables
CREATE OR REPLACE FUNCTION public.provision_csm_api_key(
    p_tenant_slug   TEXT,
    p_api_key       TEXT
)
RETURNS TEXT  -- returns the SHA-256 hex hash of the API key
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs as postgres, which has vault schema access
SET search_path = public, vault, extensions
AS $$
DECLARE
    v_vault_key_name    TEXT;
    v_key_hash          TEXT;
    v_existing_secret   UUID;
BEGIN
    -- Build the canonical Vault key name: CSM_APIKEY_BEAUMONT_BBQ
    v_vault_key_name := 'CSM_APIKEY_' || UPPER(REPLACE(p_tenant_slug, '-', '_'));

    -- Check if a secret with this name already exists in Vault
    SELECT id INTO v_existing_secret
    FROM vault.secrets
    WHERE name = v_vault_key_name
    LIMIT 1;

    IF v_existing_secret IS NOT NULL THEN
        -- Update the existing secret (for key rotation)
        UPDATE vault.secrets
        SET secret = p_api_key,
            updated_at = NOW()
        WHERE id = v_existing_secret;
    ELSE
        -- Create the secret in Vault for the first time
        PERFORM vault.create_secret(
            p_api_key,                                                      -- the secret value
            v_vault_key_name,                                               -- predictable name
            'Partner CSM API Key for tenant: ' || p_tenant_slug             -- description
        );
    END IF;

    -- Compute SHA-256 hash of the plaintext key using pgcrypto
    -- This is what gets stored in partner_csm_tenants.api_key_hash
    v_key_hash := encode(digest(p_api_key::bytea, 'sha256'), 'hex');

    RETURN v_key_hash;
END;
$$;

-- Only service_role can call this function (Edge Functions run as service_role)
REVOKE ALL ON FUNCTION public.provision_csm_api_key(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_csm_api_key(TEXT, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.provision_csm_api_key(TEXT, TEXT) TO service_role;

-- 3. Secure RPC: Rotate an existing tenant's API key
--    Called by onboard-csm-tenant with { rotate: true }
--    Returns the new hash so partner_csm_tenants can be updated.
CREATE OR REPLACE FUNCTION public.rotate_csm_api_key(
    p_tenant_slug   TEXT,
    p_new_api_key   TEXT
)
RETURNS TEXT  -- returns the NEW SHA-256 hash
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
BEGIN
    -- Rotation uses the same upsert logic as provisioning
    RETURN public.provision_csm_api_key(p_tenant_slug, p_new_api_key);
END;
$$;

REVOKE ALL ON FUNCTION public.rotate_csm_api_key(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rotate_csm_api_key(TEXT, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.rotate_csm_api_key(TEXT, TEXT) TO service_role;

-- 4. Secure RPC: Retrieve a tenant's API key FROM Vault (admin-only use)
--    Used by the fan-out and bridge-receiver functions as an alternative
--    to env var lookups — reads directly from Vault at runtime.
CREATE OR REPLACE FUNCTION public.get_csm_api_key(
    p_tenant_slug   TEXT
)
RETURNS TEXT  -- returns the plaintext API key (ONLY call from service_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
    v_vault_key_name    TEXT;
    v_api_key           TEXT;
BEGIN
    v_vault_key_name := 'CSM_APIKEY_' || UPPER(REPLACE(p_tenant_slug, '-', '_'));

    SELECT decrypted_secret INTO v_api_key
    FROM vault.decrypted_secrets
    WHERE name = v_vault_key_name
    LIMIT 1;

    IF v_api_key IS NULL THEN
        RAISE EXCEPTION 'No API key found in Vault for tenant: %', p_tenant_slug;
    END IF;

    RETURN v_api_key;
END;
$$;

REVOKE ALL ON FUNCTION public.get_csm_api_key(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_csm_api_key(TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.get_csm_api_key(TEXT) TO service_role;

-- =============================================================================
-- How Vault Storage Works:
--
-- vault.create_secret()  → encrypts with pgsodium (AES-256-GCM) and stores
-- vault.decrypted_secrets → view that decrypts on-the-fly for service_role
--
-- The plaintext key NEVER touches:
--   - partner_csm_tenants table (only the SHA-256 hash)
--   - Edge Function logs (never logged)
--   - Application state (returned once, then forgotten)
--
-- The only place plaintext lives: Supabase Vault (encrypted at rest)
-- =============================================================================
