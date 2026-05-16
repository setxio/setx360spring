-- =============================================================================
-- SETX 360 — Phase 2: Multi-Vendor Order Schema Extension
-- Extends the existing `orders` table to support multi-merchant checkouts
-- where each order can span multiple Partner CSM stores with independent
-- fulfillment types and individual Stripe transfer tracking.
-- =============================================================================

-- 1. Add multi-vendor columns to the existing orders table
--    vendor_line_items: Array of per-merchant order groups.
--    Each element: { store_id, csm_tenant_id, items[], subtotal, fulfillment_type, stripe_transfer_id }
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vendor_line_items     JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_checkout_session_id  TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee_amount   DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee_bps      INT DEFAULT 500; -- 5% default, locked at time of order
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fan_out_status        TEXT DEFAULT 'pending'
    CHECK (fan_out_status IN ('pending', 'dispatched', 'partial_failure', 'complete', 'not_required'));

-- 2. The DLQ references orders — add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session    ON public.orders (stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_fan_out_status    ON public.orders (fan_out_status);

-- 3. Update the status constraint to allow 'partially_refunded' (normalise spelling)
--    Note: We preserve existing rows. The constraint was added in 20260426_order_system.sql.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check'
    ) THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
    END IF;
END $$;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'refunded', 'partially_refunded', 'cancelled'));

-- 4. Secure RPC: Create a multi-vendor order atomically
--    Called by the frontend before redirecting to Stripe Checkout.
--    Returns the new order ID to be stored in Stripe session metadata.
CREATE OR REPLACE FUNCTION public.create_multivendor_order(
    p_customer_id       UUID,
    p_vendor_items      JSONB,   -- Array: [{ store_id, csm_tenant_id, items[], subtotal, fulfillment_type }]
    p_total_amount      DECIMAL,
    p_platform_fee_bps  INT DEFAULT 500
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id          UUID;
    v_platform_fee      DECIMAL;
BEGIN
    -- Calculate total platform fee from all vendor subtotals
    SELECT COALESCE(SUM((elem->>'subtotal')::DECIMAL), 0) * p_platform_fee_bps / 10000.0
    INTO v_platform_fee
    FROM jsonb_array_elements(p_vendor_items) elem;

    INSERT INTO public.orders (
        customer_id,
        vendor_line_items,
        amount,
        currency,
        platform_fee_amount,
        platform_fee_bps,
        status,
        fan_out_status
    ) VALUES (
        p_customer_id,
        p_vendor_items,
        p_total_amount,
        'USD',
        v_platform_fee,
        p_platform_fee_bps,
        'pending',
        'pending'
    )
    RETURNING id INTO v_order_id;

    RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_multivendor_order(UUID, JSONB, DECIMAL, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_multivendor_order(UUID, JSONB, DECIMAL, INT) TO service_role;
