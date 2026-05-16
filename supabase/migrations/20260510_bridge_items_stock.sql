-- =============================================================================
-- SETX 360 — Bridge Items Stock Management
-- Adds stock tracking to bridge_items so marketplace listings
-- can go out-of-stock in near-real-time when setx.io POS sells inventory.
-- =============================================================================

ALTER TABLE public.bridge_items ADD COLUMN IF NOT EXISTS stock_quantity   INT     DEFAULT NULL;  -- NULL = unlimited/not tracked
ALTER TABLE public.bridge_items ADD COLUMN IF NOT EXISTS stock_reserved    INT     DEFAULT 0;     -- Reserved but not yet purchased
ALTER TABLE public.bridge_items ADD COLUMN IF NOT EXISTS track_inventory   BOOLEAN DEFAULT FALSE; -- Only track stock if true
ALTER TABLE public.bridge_items ADD COLUMN IF NOT EXISTS allow_backorder   BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bridge_items ADD COLUMN IF NOT EXISTS low_stock_threshold INT   DEFAULT 5;    -- Triggers low stock warning

-- Computed availability column
ALTER TABLE public.bridge_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;

-- Auto-update is_available when stock changes
CREATE OR REPLACE FUNCTION public.update_bridge_item_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.track_inventory = TRUE AND NEW.stock_quantity IS NOT NULL THEN
        NEW.is_available := (NEW.stock_quantity - COALESCE(NEW.stock_reserved, 0)) > 0
                            OR NEW.allow_backorder = TRUE;
    ELSE
        NEW.is_available := TRUE; -- If not tracking inventory, always available
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bridge_item_availability ON public.bridge_items;
CREATE TRIGGER trg_bridge_item_availability
    BEFORE INSERT OR UPDATE OF stock_quantity, stock_reserved, track_inventory, allow_backorder
    ON public.bridge_items
    FOR EACH ROW EXECUTE FUNCTION public.update_bridge_item_availability();

-- Atomic stock decrement RPC (called by inventory-sync function)
CREATE OR REPLACE FUNCTION public.decrement_bridge_item_stock(
    p_bridge_item_id UUID,
    p_quantity       INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
    v_item  RECORD;
    v_avail INT;
BEGIN
    SELECT id, stock_quantity, stock_reserved, track_inventory, allow_backorder
    INTO v_item
    FROM public.bridge_items
    WHERE id = p_bridge_item_id
    FOR UPDATE; -- Row-level lock for concurrent POS sales

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Item not found');
    END IF;

    IF NOT v_item.track_inventory OR v_item.stock_quantity IS NULL THEN
        RETURN jsonb_build_object('success', true, 'tracked', false);
    END IF;

    v_avail := v_item.stock_quantity - COALESCE(v_item.stock_reserved, 0);

    IF v_avail < p_quantity AND NOT v_item.allow_backorder THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient stock',
            'available', v_avail,
            'requested', p_quantity
        );
    END IF;

    UPDATE public.bridge_items
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_bridge_item_id;

    RETURN jsonb_build_object(
        'success',    true,
        'tracked',    true,
        'remaining',  v_item.stock_quantity - p_quantity
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_bridge_item_stock(UUID, INT) TO service_role;

-- Low stock index for admin alerting
CREATE INDEX IF NOT EXISTS idx_bridge_items_low_stock
    ON public.bridge_items (store_id, stock_quantity)
    WHERE track_inventory = TRUE AND stock_quantity IS NOT NULL;
