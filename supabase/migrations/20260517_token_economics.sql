-- =============================================================================
-- SETX 360: Token Economics & Civic Identity
-- =============================================================================

-- 1. Create the civic_voter_registry
-- Ensures absolute 1:1 mapping between a real human profile and a Soulbound DID token.
CREATE TABLE IF NOT EXISTS public.civic_voter_registry (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    sbt_token_id BIGINT UNIQUE NOT NULL, -- Matches the EVM SETXIdentity tokenId
    issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for voter registry
ALTER TABLE public.civic_voter_registry ENABLE ROW LEVEL SECURITY;

-- Only admins can issue/revoke. Public can view.
CREATE POLICY "Anyone can view civic voter status" ON public.civic_voter_registry
    FOR SELECT USING (true);


-- 2. Balance Integrity Trigger
-- We want to ensure that any change to `wallet_balances.balance_setx` 
-- mathematically corresponds to a recorded ledger transaction.
-- We cannot use a simple CHECK constraint to look at another table, so we use a Trigger.

-- Create a secure auditing function
CREATE OR REPLACE FUNCTION audit_balance_integrity()
RETURNS TRIGGER AS $$
DECLARE
    delta NUMERIC;
    matching_tx_exists BOOLEAN;
BEGIN
    -- Calculate the exact change in balance
    delta := NEW.balance_setx - OLD.balance_setx;
    
    -- If there's no change to the balance, allow it
    IF delta = 0 THEN
        RETURN NEW;
    END IF;

    -- If balance changed, we MUST find a recently completed ledger transaction
    -- that matches this exact delta for this user's destination tag.
    
    -- Note: For a strict distributed ledger, the delta could be positive (receive/mint) 
    -- or negative (send/burn). The transaction table should have a record.
    -- (We use a 2-minute window to allow for latency between Stripe webhooks and DB inserts)
    
    SELECT EXISTS (
        SELECT 1 FROM public.ledger_transactions
        WHERE 
            status = 'completed'
            AND amount_setx = abs(delta)
            AND (
                -- If delta is positive, user is receiver
                (delta > 0 AND receiver_tag = (SELECT dest_tag FROM public.profiles WHERE id = NEW.profile_id))
                OR
                -- If delta is negative, user is sender
                (delta < 0 AND sender_tag = (SELECT dest_tag FROM public.profiles WHERE id = NEW.profile_id))
            )
            AND created_at >= (NOW() - INTERVAL '2 minutes')
    ) INTO matching_tx_exists;

    IF NOT matching_tx_exists THEN
        RAISE EXCEPTION 'Balance Integrity Violation: Cannot alter balance_setx without a matching completed ledger_transaction. Phantom tokens blocked.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to the wallet_balances table
DROP TRIGGER IF EXISTS ensure_balance_integrity ON public.wallet_balances;
CREATE TRIGGER ensure_balance_integrity
    BEFORE UPDATE OF balance_setx ON public.wallet_balances
    FOR EACH ROW
    EXECUTE FUNCTION audit_balance_integrity();

