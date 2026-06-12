-- =============================================================================
-- SETX Labs — Developer Hub Phase 1
-- App registration, API key mgmt, staging gate toggle, integrations, locality check
-- =============================================================================

-- SETX-region zip codes (Southeast Texas)
CREATE TABLE IF NOT EXISTS public.setx_zip_codes (
  zip_code TEXT PRIMARY KEY,
  city TEXT,
  county TEXT
);

INSERT INTO public.setx_zip_codes (zip_code, city, county) VALUES
  ('77701','Beaumont','Jefferson'),('77702','Beaumont','Jefferson'),
  ('77703','Beaumont','Jefferson'),('77704','Beaumont','Jefferson'),
  ('77705','Beaumont','Jefferson'),('77706','Beaumont','Jefferson'),
  ('77707','Beaumont','Jefferson'),('77708','Beaumont','Jefferson'),
  ('77710','Beaumont','Jefferson'),('77713','Beaumont','Jefferson'),
  ('77627','Nederland','Jefferson'),('77640','Port Arthur','Jefferson'),
  ('77641','Port Arthur','Jefferson'),('77642','Port Arthur','Jefferson'),
  ('77643','Port Arthur','Jefferson'),('77651','Port Neches','Jefferson'),
  ('77655','Sabine Pass','Jefferson'),('77657','Lumberton','Hardin'),
  ('77656','Silsbee','Hardin'),('77659','Sour Lake','Hardin'),
  ('77612','Buna','Jasper'),('77614','Deweyville','Newton'),
  ('77615','Evadale','Jasper'),('77619','Groves','Jefferson'),
  ('77622','Hamshire','Jefferson'),('77625','Kountze','Hardin'),
  ('77626','Mauriceville','Orange'),('77630','Orange','Orange'),
  ('77631','Orange','Orange'),('77632','Orange','Orange'),
  ('77639','Mauriceville','Orange'),('77662','Vidor','Orange'),
  ('77664','Warren','Tyler'),('77665','Winnie','Chambers'),
  ('77670','Orangefield','Orange'),('77713','China','Jefferson')
ON CONFLICT DO NOTHING;

-- Add zip + is_developer to profiles if not already there
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_developer BOOLEAN DEFAULT false;

-- Developer-registered apps
CREATE TABLE IF NOT EXISTS public.developer_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  app_url TEXT NOT NULL,
  staged_url TEXT,
  category TEXT DEFAULT 'labs' CHECK (category IN ('pro', 'labs')),
  is_live BOOLEAN DEFAULT false,
  api_key_hash TEXT,
  api_key_prefix TEXT,
  api_key_vault_name TEXT,
  last_toggled_at TIMESTAMPTZ,
  last_toggle_note TEXT,
  published_at TIMESTAMPTZ,
  version_label TEXT DEFAULT 'v1.0',
  tech_stack TEXT DEFAULT 'nextjs',
  vercel_project_id TEXT,
  vercel_token_hint TEXT,
  github_repo_url TEXT,
  github_token_hint TEXT,
  supabase_project_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Version snapshots (saved each time dev toggles live)
CREATE TABLE IF NOT EXISTS public.developer_app_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES public.developer_apps(id) ON DELETE CASCADE NOT NULL,
  version_label TEXT,
  app_url TEXT,
  snapshot_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration connectors per app
CREATE TABLE IF NOT EXISTS public.developer_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES public.developer_apps(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'vercel', 'supabase', 'webhook')),
  external_id TEXT,
  display_name TEXT,
  metadata JSONB DEFAULT '{}',
  is_connected BOOLEAN DEFAULT false,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.developer_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_app_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setx_zip_codes ENABLE ROW LEVEL SECURITY;

-- Owners manage their own apps
CREATE POLICY "Owners manage their apps"
  ON public.developer_apps FOR ALL USING (auth.uid() = owner_id);

-- Public can read live apps (for SETX 360 Apps market)
CREATE POLICY "Public reads live apps"
  ON public.developer_apps FOR SELECT USING (is_live = true);

CREATE POLICY "Owners manage snapshots"
  ON public.developer_app_snapshots FOR ALL
  USING (app_id IN (SELECT id FROM public.developer_apps WHERE owner_id = auth.uid()));

CREATE POLICY "Owners manage integrations"
  ON public.developer_integrations FOR ALL
  USING (app_id IN (SELECT id FROM public.developer_apps WHERE owner_id = auth.uid()));

CREATE POLICY "Anyone can check zip codes"
  ON public.setx_zip_codes FOR SELECT USING (true);

-- RPC: Check if a zip code is in SETX region
CREATE OR REPLACE FUNCTION public.is_setx_zip(p_zip TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.setx_zip_codes WHERE zip_code = p_zip);
$$;

GRANT EXECUTE ON FUNCTION public.is_setx_zip(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_setx_zip(TEXT) TO anon;

-- RPC: Provision a developer API key (wraps CSM vault pattern)
CREATE OR REPLACE FUNCTION public.provision_developer_api_key(
  p_app_id UUID,
  p_owner_id UUID
)
RETURNS TABLE(key_prefix TEXT, key_hash TEXT, vault_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_raw_key TEXT;
  v_prefix TEXT;
  v_hash TEXT;
  v_vault_name TEXT;
  v_existing UUID;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (SELECT 1 FROM public.developer_apps WHERE id = p_app_id AND owner_id = p_owner_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Generate a secure random key: setxk1_ + 32 random hex chars
  v_raw_key := 'setxk1_' || encode(gen_random_bytes(16), 'hex');
  v_prefix := LEFT(v_raw_key, 15) || '...';
  v_hash := encode(digest(v_raw_key::bytea, 'sha256'), 'hex');
  v_vault_name := 'DEV_APIKEY_' || REPLACE(p_app_id::TEXT, '-', '_');

  -- Store in Vault (upsert pattern)
  SELECT id INTO v_existing FROM vault.secrets WHERE name = v_vault_name LIMIT 1;
  IF v_existing IS NOT NULL THEN
    UPDATE vault.secrets SET secret = v_raw_key, updated_at = NOW() WHERE id = v_existing;
  ELSE
    PERFORM vault.create_secret(v_raw_key, v_vault_name, 'Developer API key for app: ' || p_app_id::TEXT);
  END IF;

  -- Update the app row (hash + prefix only — plaintext stays in Vault)
  UPDATE public.developer_apps
  SET api_key_hash = v_hash, api_key_prefix = v_prefix, api_key_vault_name = v_vault_name, updated_at = NOW()
  WHERE id = p_app_id;

  RETURN QUERY SELECT v_prefix, v_hash, v_vault_name;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_developer_api_key(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_developer_api_key(UUID, UUID) TO authenticated;

-- RPC: Retrieve plaintext key for one-time display (owner only, service_role edge fn)
CREATE OR REPLACE FUNCTION public.get_developer_api_key(p_app_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_vault_name TEXT;
  v_key TEXT;
BEGIN
  SELECT api_key_vault_name INTO v_vault_name FROM public.developer_apps WHERE id = p_app_id LIMIT 1;
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = v_vault_name LIMIT 1;
  IF v_key IS NULL THEN RAISE EXCEPTION 'No key found'; END IF;
  RETURN v_key;
END;
$$;

REVOKE ALL ON FUNCTION public.get_developer_api_key(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_developer_api_key(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_developer_api_key(UUID) TO service_role;
