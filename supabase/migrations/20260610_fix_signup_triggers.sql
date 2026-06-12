-- Patch for "Database error saving new user"
-- Fixes missing search_path issues for pgcrypto digest() in SECURITY DEFINER triggers
-- Ensures all necessary extensions and sequences exist

-- 1. Ensure pgcrypto exists in extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 2. Fix the DUNA signature trigger to use explicit schema for digest
CREATE OR REPLACE FUNCTION public.record_duna_signature()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    signature_data TEXT;
    signature_hash TEXT;
BEGIN
    signature_data := NEW.email || NOW()::TEXT || 'DUNA_CONSENT';
    -- Explicitly use extensions.digest to prevent search_path issues
    signature_hash := encode(extensions.digest(signature_data, 'sha256'), 'hex');

    INSERT INTO public.duna_foundational_signers (profile_id, conduct_signature_hash)
    VALUES (NEW.id, signature_hash)
    ON CONFLICT (profile_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- 3. Ensure XRPL sequence exists and assign trigger is robust
CREATE SEQUENCE IF NOT EXISTS public.xrpl_dest_tag_seq START 100000;

CREATE OR REPLACE FUNCTION public.assign_xrpl_destination_tag_and_wallet()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.xrpl_destination_tag IS NULL THEN
        NEW.xrpl_destination_tag := nextval('public.xrpl_dest_tag_seq');
    END IF;
    RETURN NEW;
END;
$$;

-- 4. Ensure wallet balances table exists just in case
CREATE TABLE IF NOT EXISTS public.wallet_balances (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance_setx DECIMAL(16,6) NOT NULL DEFAULT 0.000000,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.initialize_wallet_balance()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.wallet_balances (profile_id, balance_setx)
    VALUES (NEW.id, 0.000000)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 5. Validate the main profile creation trigger 
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, name, first_name, last_name, email, role, zip, community, county, state, country, location, birth_month, birth_day, birth_year, is_public, allow_dms
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'resident'),
    new.raw_user_meta_data->>'zip',
    new.raw_user_meta_data->>'community',
    new.raw_user_meta_data->>'county',
    COALESCE(new.raw_user_meta_data->>'state', 'Texas'),
    COALESCE(new.raw_user_meta_data->>'country', 'USA'),
    COALESCE(new.raw_user_meta_data->>'location', 'Visitor'),
    (new.raw_user_meta_data->>'birth_month')::INT,
    (new.raw_user_meta_data->>'birth_day')::INT,
    (new.raw_user_meta_data->>'birth_year')::INT,
    COALESCE((new.raw_user_meta_data->>'is_public')::BOOLEAN, TRUE),
    COALESCE((new.raw_user_meta_data->>'allow_dms')::BOOLEAN, TRUE)
  );
  RETURN new;
END;
$$;

-- 6. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
