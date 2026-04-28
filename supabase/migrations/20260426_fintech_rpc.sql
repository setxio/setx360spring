-- SETX Fintech RPC Functions

-- 1. transfer_funds
-- A highly secure, atomic transaction function that executes a double-entry ledger update.
CREATE OR REPLACE FUNCTION public.transfer_funds(
    sender_wallet_id UUID,
    receiver_wallet_id UUID,
    transfer_amount DECIMAL(12,2),
    transfer_type TEXT,
    transfer_description TEXT,
    reference TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    sender_balance DECIMAL;
    receiver_balance DECIMAL;
    group_id UUID;
BEGIN
    -- 1. Basic Validations
    IF transfer_amount <= 0 THEN
        RAISE EXCEPTION 'Transfer amount must be greater than 0';
    END IF;

    IF sender_wallet_id = receiver_wallet_id THEN
        RAISE EXCEPTION 'Sender and receiver wallets cannot be the same';
    END IF;

    -- 2. Lock the sender wallet to prevent race conditions (row-level lock)
    SELECT balance INTO sender_balance 
    FROM public.fintech_wallets 
    WHERE id = sender_wallet_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sender wallet not found';
    END IF;

    IF sender_balance < transfer_amount THEN
        RAISE EXCEPTION 'Insufficient funds in sender wallet';
    END IF;

    -- 3. Lock the receiver wallet
    SELECT balance INTO receiver_balance 
    FROM public.fintech_wallets 
    WHERE id = receiver_wallet_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Receiver wallet not found';
    END IF;

    -- 4. Execute the Double-Entry Ledger Insert
    group_id := uuid_generate_v4();

    -- Debit Entry (Sender)
    INSERT INTO public.fintech_ledger (
        transaction_group_id, wallet_id, amount, type, description, reference_id
    ) VALUES (
        group_id, sender_wallet_id, -transfer_amount, transfer_type, transfer_description, reference
    );

    -- Credit Entry (Receiver)
    INSERT INTO public.fintech_ledger (
        transaction_group_id, wallet_id, amount, type, description, reference_id
    ) VALUES (
        group_id, receiver_wallet_id, transfer_amount, transfer_type, transfer_description, reference
    );

    -- 5. Update Wallet Balances
    UPDATE public.fintech_wallets 
    SET balance = balance - transfer_amount, updated_at = NOW() 
    WHERE id = sender_wallet_id;

    UPDATE public.fintech_wallets 
    SET balance = balance + transfer_amount, updated_at = NOW() 
    WHERE id = receiver_wallet_id;

    -- Return success payload
    RETURN jsonb_build_object(
        'success', true,
        'transaction_group_id', group_id,
        'amount', transfer_amount,
        'sender_new_balance', sender_balance - transfer_amount
    );

EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs, the entire transaction is rolled back by PostgreSQL automatically
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER allows this function to bypass RLS, which is necessary since we blocked direct INSERTs to the ledger.
