-- =============================================================================
-- SETX 360: Data Sovereignty Layer (DIDs & IPFS Hashes)
-- =============================================================================

-- 1. Modify the profiles table to include the XRPL EVM Sidechain DID
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS did_address TEXT UNIQUE;

-- 2. Create the content type ENUM if it doesn't exist
DO $$ BEGIN
    CREATE TYPE sovereign_content_type AS ENUM ('social_post', 'product_listing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create the sovereign_content vault table
CREATE TABLE IF NOT EXISTS public.sovereign_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_did TEXT REFERENCES public.profiles(did_address) ON DELETE CASCADE NOT NULL,
    content_cid TEXT UNIQUE NOT NULL,
    content_type sovereign_content_type NOT NULL,
    is_encrypted BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    xrpl_tx_hash TEXT -- Optional: Track the specific ledger transaction that secured the CID
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.sovereign_content ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Anyone can read public (unencrypted) sovereign content CIDs
CREATE POLICY "Public can view unencrypted content CIDs" ON public.sovereign_content
    FOR SELECT USING (is_encrypted = false);

-- Users can read their own content (even if encrypted)
CREATE POLICY "Users can view their own content CIDs" ON public.sovereign_content
    FOR SELECT USING (
        user_did = (SELECT did_address FROM public.profiles WHERE id = auth.uid())
    );

-- Users can only insert content if it matches their DID
CREATE POLICY "Users can insert their own content" ON public.sovereign_content
    FOR INSERT WITH CHECK (
        user_did = (SELECT did_address FROM public.profiles WHERE id = auth.uid())
    );

-- Users can delete their own sovereign content (Revoking access)
CREATE POLICY "Users can delete their own content" ON public.sovereign_content
    FOR DELETE USING (
        user_did = (SELECT did_address FROM public.profiles WHERE id = auth.uid())
    );
