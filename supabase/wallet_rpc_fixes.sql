-- Wallet Security Fixes

-- 1. Create or replace the decrement RPC to prevent double-spends and negative balances.
CREATE OR REPLACE FUNCTION decrement_wallet_balance(pid UUID, amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges, bypassing RLS to ensure atomic updates
AS $$
BEGIN
    IF amount <= 0 THEN
        RAISE EXCEPTION 'Amount to decrement must be greater than zero';
    END IF;

    -- Update and check that the balance does not fall below zero in the same statement
    UPDATE public.wallet_balances
    SET balance_setx = balance_setx - amount
    WHERE profile_id = pid AND (balance_setx - amount) >= 0;

    -- If no rows were updated, it means either the profile doesn't exist or balance is insufficient
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient balance or wallet not found';
    END IF;
END;
$$;


-- 2. Create or replace the increment RPC to ensure the wallet balance safely increments.
CREATE OR REPLACE FUNCTION increment_wallet_balance(pid UUID, amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF amount <= 0 THEN
        RAISE EXCEPTION 'Amount to increment must be greater than zero';
    END IF;

    -- Attempt to update existing row
    UPDATE public.wallet_balances
    SET balance_setx = balance_setx + amount
    WHERE profile_id = pid;

    -- If the wallet didn't exist, create it
    IF NOT FOUND THEN
        INSERT INTO public.wallet_balances (profile_id, balance_setx)
        VALUES (pid, amount);
    END IF;
END;
$$;
