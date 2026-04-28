-- SETX Dynamic Platform Fees

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id INT PRIMARY KEY DEFAULT 1
);

-- Safely add columns if the table already existed
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS vendor_fee_percentage DECIMAL(5,4) DEFAULT 0.1000;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS driver_fee_percentage DECIMAL(5,4) DEFAULT 0.1000;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS base_delivery_fee DECIMAL(12,2) DEFAULT 3.00;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS stripe_connected BOOLEAN DEFAULT false;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS is_refunds_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS refund_window_days INT DEFAULT 30;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Safely add the check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'platform_settings_id_check'
    ) THEN
        ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_id_check CHECK (id = 1);
    END IF;
END $$;

-- Insert default row if it doesn't exist
INSERT INTO public.platform_settings (id, vendor_fee_percentage, driver_fee_percentage, base_delivery_fee, stripe_connected) 
VALUES (1, 0.1000, 0.1000, 3.00, false) 
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings (needed for frontend checkout calculations)
DROP POLICY IF EXISTS "Public can read platform settings" ON public.platform_settings;
CREATE POLICY "Public can read platform settings" ON public.platform_settings FOR SELECT USING (true);

-- Only admins can update the settings
DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Admins can update platform settings" ON public.platform_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'city_manager'))
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'city_manager'))
);
