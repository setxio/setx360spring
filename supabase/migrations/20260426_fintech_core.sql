-- SETX Fintech Core Architecture

-- 1. Digital Wallets
-- Every user, business, and city department gets a wallet to hold their SEC (SETX Economic Credits).
CREATE TABLE IF NOT EXISTS public.fintech_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0.00 CHECK (balance >= 0), -- Prevents overdrafts at the DB level
    currency TEXT DEFAULT 'SEC', -- SETX Economic Credits (1 SEC = $1 USD internally)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
    wallet_type TEXT DEFAULT 'personal' CHECK (wallet_type IN ('personal', 'business', 'civic', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_id, currency)
);

-- 2. Double-Entry Ledger
-- The immutable ledger. Every transaction creates two rows (a debit and a credit).
CREATE TABLE IF NOT EXISTS public.fintech_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_group_id UUID NOT NULL, -- Ties the debit and credit together
    wallet_id UUID NOT NULL REFERENCES public.fintech_wallets(id) ON DELETE RESTRICT,
    amount DECIMAL(12,2) NOT NULL, -- Negative for debit, Positive for credit
    type TEXT NOT NULL CHECK (type IN ('payment', 'deposit', 'withdrawal', 'refund', 'fee')),
    description TEXT,
    reference_id TEXT, -- Ties to an order, utility bill, etc.
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. KYC (Know Your Customer) Compliance
-- Tracks verification status for regulatory purposes before allowing withdrawals.
CREATE TABLE IF NOT EXISTS public.fintech_kyc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    document_type TEXT,
    document_url TEXT,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id)
);

-- RLS Policies
ALTER TABLE public.fintech_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fintech_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fintech_kyc ENABLE ROW LEVEL SECURITY;

-- Wallets: Users can only see their own wallets
CREATE POLICY "Users can see own wallets" ON public.fintech_wallets FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'city_manager'))
);

-- Ledger: Users can only see their own ledger entries
CREATE POLICY "Users can see own ledger entries" ON public.fintech_ledger FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.fintech_wallets 
        WHERE fintech_wallets.id = fintech_ledger.wallet_id AND fintech_wallets.owner_id = auth.uid()
    ) OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'city_manager'))
);

-- KYC: Users can see their own KYC status
CREATE POLICY "Users can see own KYC" ON public.fintech_kyc FOR SELECT USING (auth.uid() = profile_id);

-- Note: We intentionally do NOT create INSERT policies for the ledger or wallets here.
-- ALL modifications must go through the secure RPC functions to prevent tampering.
