-- 1. Fulfillment Type Support
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_type text DEFAULT 'pickup'; -- 'delivery', 'pickup', 'shipping'

-- 2. Extended Order Statuses
-- Ensure status column exists and has proper types/documentation
COMMENT ON COLUMN public.orders.status IS 'Order fulfillment status: pending, preparing, ready_for_pickup, out_for_delivery, delivered, picked_up, shipped, cancelled';

-- 3. Shipping Metadata
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_carrier text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_label_url text;

-- 4. Pickup Specifics
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_window_start timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_window_end timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS curb_pickup_details text;

-- 5. Helper Function to get Active Orders (Carousel Support)
CREATE OR REPLACE FUNCTION public.get_active_orders(user_id uuid)
RETURNS SETOF public.orders AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.orders
    WHERE customer_id = user_id
    AND status NOT IN ('delivered', 'picked_up', 'cancelled')
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
