-- Create Ads Table
CREATE TABLE IF NOT EXISTS public.platform_ads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id uuid REFERENCES public.stores(id),
    content_type text NOT NULL, -- 'post', 'product', 'store'
    content_id uuid NOT NULL,
    budget numeric NOT NULL,
    status text DEFAULT 'pending', -- 'pending', 'active', 'paused', 'completed'
    start_date timestamp with time zone DEFAULT now(),
    end_date timestamp with time zone,
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_ads ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ads are viewable by everyone') THEN
        CREATE POLICY "Ads are viewable by everyone" ON public.platform_ads FOR SELECT USING (true);
    END IF;
END $$;
