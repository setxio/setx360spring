-- =============================================================================
-- SETX 360: XRPL Ledger & Destination Tags Schema
-- =============================================================================

-- 1. Extend profiles to include XRPL Destination Tag and off-chain balance
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xrpl_destination_tag BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS setx_coin_balance DECIMAL(16,6) DEFAULT 0.000000;

-- Auto-generate a sequential destination tag for new users (or backfill)
CREATE SEQUENCE IF NOT EXISTS xrpl_dest_tag_seq START 100000;

CREATE OR REPLACE FUNCTION assign_xrpl_destination_tag()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.xrpl_destination_tag IS NULL THEN
        NEW.xrpl_destination_tag := nextval('xrpl_dest_tag_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_xrpl_destination_tag ON public.profiles;
CREATE TRIGGER trg_assign_xrpl_destination_tag
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION assign_xrpl_destination_tag();

-- 2. Ledger Transactions Table
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    csm_tenant_id       UUID        REFERENCES public.partner_csm_tenants(id) ON DELETE SET NULL, -- Null if P2P or system
    
    transaction_type    TEXT        NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'purchase', 'p2p_transfer', 'gas_fee', 'reward')),
    amount              DECIMAL(16,6) NOT NULL,
    currency            TEXT        DEFAULT 'SETX', -- SETX Coin ($1 USD fiat-peg)
    
    xrpl_tx_hash        TEXT        UNIQUE,         -- Hash from XRPL Testnet
    xrpl_wallet_source  TEXT,                       -- Which county operational wallet handled this
    destination_tag     BIGINT      NOT NULL,
    
    status              TEXT        NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending', 'completed', 'failed')),
    
    metadata            JSONB       DEFAULT '{}',   -- Store item info, checkout session, etc.
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Timestamps trigger
CREATE OR REPLACE FUNCTION update_ledger_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_transactions_updated_at ON public.ledger_transactions;
CREATE TRIGGER trg_ledger_transactions_updated_at
    BEFORE UPDATE ON public.ledger_transactions
    FOR EACH ROW EXECUTE FUNCTION update_ledger_transactions_updated_at();

-- 3. RLS Policies
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ledger transactions" ON public.ledger_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service roles can manage ledger transactions" ON public.ledger_transactions
    FOR ALL USING (
        auth.role() = 'service_role' OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_user_id ON public.ledger_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_csm_tenant_id ON public.ledger_transactions(csm_tenant_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_xrpl_tx_hash ON public.ledger_transactions(xrpl_tx_hash);
CREATE INDEX IF NOT EXISTS idx_profiles_destination_tag ON public.profiles(xrpl_destination_tag);
