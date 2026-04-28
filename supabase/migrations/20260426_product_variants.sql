-- Create product_variants table to support Shopify/WooCommerce "variables"
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Large / Blue"
    sku TEXT,
    price DECIMAL(12,2),
    stock_quantity INTEGER DEFAULT 0,
    external_id TEXT, -- To store Shopify/WooCommerce variant ID for syncing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add external_id to products for sync mapping
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS external_source TEXT; -- 'shopify', 'woocommerce'
