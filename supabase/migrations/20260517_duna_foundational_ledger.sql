-- =============================================================================
-- SETX 360: DUNA Pre-Launch Foundation Logging (HB 4518)
-- =============================================================================

-- Enable pgcrypto for SHA-256 hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create a table to lock in foundational membership logs for Day 1 compliance
CREATE TABLE IF NOT EXISTS public.duna_foundational_signers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    agreed_to_terms_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    conduct_signature_hash TEXT NOT NULL
);

-- Enable RLS to protect privacy
ALTER TABLE public.duna_foundational_signers ENABLE ROW LEVEL SECURITY;

-- Admins can read the hashes for filing compliance
CREATE POLICY "Admins can view DUNA signers" ON public.duna_foundational_signers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Create a view that instantly calculates your Day 1 readiness status
CREATE OR REPLACE VIEW public.duna_filing_readiness AS
SELECT 
    COUNT(id) as total_foundational_members,
    (COUNT(id) >= 100) as is_legally_ready_to_file
FROM public.duna_foundational_signers;

-- 3. Trigger to auto-log foundational signers upon registration
CREATE OR REPLACE FUNCTION record_duna_signature()
RETURNS TRIGGER AS $$
DECLARE
    signature_data TEXT;
    signature_hash TEXT;
BEGIN
    -- The prompt defined hash as: SHA256 of (user_email + timestamp + 'DUNA_CONSENT')
    -- To ensure consistency and non-repudiation:
    signature_data := NEW.email || NOW()::TEXT || 'DUNA_CONSENT';
    signature_hash := encode(digest(signature_data, 'sha256'), 'hex');

    INSERT INTO public.duna_foundational_signers (profile_id, conduct_signature_hash)
    VALUES (NEW.id, signature_hash)
    ON CONFLICT (profile_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_record_duna_signature ON public.profiles;
CREATE TRIGGER trg_record_duna_signature
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION record_duna_signature();

-- 4. Backfill existing users into the holding tank
INSERT INTO public.duna_foundational_signers (profile_id, conduct_signature_hash)
SELECT 
    id, 
    encode(digest(email || NOW()::TEXT || 'DUNA_CONSENT', 'sha256'), 'hex')
FROM public.profiles
ON CONFLICT (profile_id) DO NOTHING;

