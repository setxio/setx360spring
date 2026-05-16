-- Update Orders for Delivery
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending'; -- 'pending', 'claimed', 'at_merchant', 'picked_up', 'arriving', 'delivered'
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_lat double precision;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_lng double precision;

-- Update Profiles for Drivers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vehicle_info text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_mode_active boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_lat double precision;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_lng double precision;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_rating numeric DEFAULT 5.0;

-- Create Delivery Logs for History
CREATE TABLE IF NOT EXISTS public.delivery_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id),
    driver_id uuid REFERENCES public.profiles(id),
    action text NOT NULL, -- 'claimed', 'status_update', etc
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_logs ENABLE ROW LEVEL SECURITY;

-- DROP if exists and recreate
DROP POLICY IF EXISTS "Delivery logs viewable by participants" ON public.delivery_logs;
CREATE POLICY "Delivery logs viewable by participants" ON public.delivery_logs
    FOR SELECT USING (auth.uid() = driver_id OR auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id));
