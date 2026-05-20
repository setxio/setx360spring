-- =============================================================================
-- SETX 360: Fiat-to-Token On-Ramp & Extended XRPL Ledger Schema
-- =============================================================================

-- 1. Create Wallet Balances Table
CREATE TABLE IF NOT EXISTS public.wallet_balances (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id          UUID        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance_setx        DECIMAL(16,6) NOT NULL DEFAULT 0.000000,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Timestamps trigger for wallet_balances
CREATE OR REPLACE FUNCTION update_wallet_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wallet_balances_updated_at ON public.wallet_balances;
CREATE TRIGGER trg_wallet_balances_updated_at
    BEFORE UPDATE ON public.wallet_balances
    FOR EACH ROW EXECUTE FUNCTION update_wallet_balances_updated_at();

-- 2. Modify Profiles (Drop the old column if it exists to strictly use wallet_balances)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'setx_coin_balance') THEN
        ALTER TABLE public.profiles DROP COLUMN setx_coin_balance;
    END IF;
END $$;

-- 3. Replace the old profiles trigger to insert into wallet_balances
CREATE OR REPLACE FUNCTION assign_xrpl_destination_tag_and_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Assign Destination Tag
    IF NEW.xrpl_destination_tag IS NULL THEN
        NEW.xrpl_destination_tag := nextval('xrpl_dest_tag_seq');
    END IF;
    
    -- We can't insert into wallet_balances here easily without causing recursive issues or doing it AFTER INSERT
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- We need an AFTER INSERT trigger to create the wallet balance row
CREATE OR REPLACE FUNCTION initialize_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallet_balances (profile_id, balance_setx)
    VALUES (NEW.id, 0.000000)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- BEFORE INSERT: assign dest tag
DROP TRIGGER IF EXISTS trg_assign_xrpl_destination_tag ON public.profiles;
CREATE TRIGGER trg_assign_xrpl_destination_tag
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION assign_xrpl_destination_tag_and_wallet();

-- AFTER INSERT: initialize wallet
DROP TRIGGER IF EXISTS trg_initialize_wallet_balance ON public.profiles;
CREATE TRIGGER trg_initialize_wallet_balance
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION initialize_wallet_balance();

-- Backfill missing wallets for existing profiles
INSERT INTO public.wallet_balances (profile_id, balance_setx)
SELECT id, 0.000000 FROM public.profiles
ON CONFLICT (profile_id) DO NOTHING;


-- 4. Extend Ledger Transactions
ALTER TABLE public.ledger_transactions 
RENAME COLUMN destination_tag TO receiver_tag;

ALTER TABLE public.ledger_transactions
ADD COLUMN IF NOT EXISTS sender_tag BIGINT;

-- Performance Indexes on Ledger Transactions
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_sender_tag ON public.ledger_transactions(sender_tag);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_receiver_tag ON public.ledger_transactions(receiver_tag);

-- Enable RLS for wallet_balances
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet balance" ON public.wallet_balances
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Service roles can manage wallet balances" ON public.wallet_balances
    FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

