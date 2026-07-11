-- =============================================================================
-- SETX 360 — Website Builder Phase 3.1 (Variable Products)
-- Adds product variations capabilities to wb_products
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wb_product_variations (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         uuid        REFERENCES public.wb_products(id) ON DELETE CASCADE NOT NULL,
  attributes         jsonb       NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"Size": "Large", "Color": "Red"}
  price              numeric(10,2),
  sale_price         numeric(10,2),
  sku                text,
  manage_stock       boolean     DEFAULT false,
  stock_quantity     integer     DEFAULT 0,
  stock_status       text        DEFAULT 'instock' CHECK (stock_status IN ('instock', 'outofstock', 'onbackorder')),
  image_url          text,
  created_at         timestamptz DEFAULT now() NOT NULL,
  updated_at         timestamptz DEFAULT now() NOT NULL
);

-- ── RLS POLICIES ─────────────────────────────────────────────────────────────
ALTER TABLE public.wb_product_variations ENABLE ROW LEVEL SECURITY;

-- Site owners manage their product variations
CREATE POLICY "Site owners manage product variations" ON public.wb_product_variations FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.wb_products p
  JOIN public.wb_sites s ON s.id = p.site_id
  WHERE p.id = wb_product_variations.product_id AND s.owner_id = auth.uid()
));

-- Public can view variations for published products
CREATE POLICY "Public can view published product variations" ON public.wb_product_variations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.wb_products p
  WHERE p.id = wb_product_variations.product_id AND p.status = 'published'
));

-- Index for fast lookup by product
CREATE INDEX IF NOT EXISTS idx_wb_product_variations_product_id ON public.wb_product_variations (product_id);
