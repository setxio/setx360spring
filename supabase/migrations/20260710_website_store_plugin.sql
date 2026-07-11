-- =============================================================================
-- SETX 360 — Website Builder Phase 3 (Store / WooCommerce Plugin)
-- Adds e-commerce and bookings capabilities to wb_sites
-- =============================================================================

-- 1. PRODUCTS
CREATE TABLE IF NOT EXISTS public.wb_products (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id            uuid        REFERENCES public.wb_sites(id) ON DELETE CASCADE NOT NULL,
  title              text        NOT NULL,
  slug               text        NOT NULL,
  description        text,
  product_type       text        DEFAULT 'simple' CHECK (product_type IN ('simple', 'variable', 'booking')),
  price              numeric(10,2),
  sale_price         numeric(10,2),
  sku                text,
  manage_stock       boolean     DEFAULT false,
  stock_quantity     integer     DEFAULT 0,
  stock_status       text        DEFAULT 'instock' CHECK (stock_status IN ('instock', 'outofstock', 'onbackorder')),
  status             text        DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'trash')),
  featured_image_url text,
  gallery_urls       text[],
  categories         text[],
  tags               text[],
  metadata           jsonb       DEFAULT '{}'::jsonb, -- Store booking specifics (duration, max capacity) here
  created_at         timestamptz DEFAULT now() NOT NULL,
  updated_at         timestamptz DEFAULT now() NOT NULL
);

-- 2. ORDERS
CREATE TABLE IF NOT EXISTS public.wb_orders (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id          uuid        REFERENCES public.wb_sites(id) ON DELETE CASCADE NOT NULL,
  customer_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for guest checkout
  customer_email   text,
  customer_name    text,
  status           text        DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  total_amount     numeric(10,2) NOT NULL DEFAULT 0,
  currency         text        DEFAULT 'USD',
  payment_status   text        DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
  shipping_address jsonb,
  billing_address  jsonb,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL
);

-- 3. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.wb_order_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid        REFERENCES public.wb_orders(id) ON DELETE CASCADE NOT NULL,
  product_id       uuid        REFERENCES public.wb_products(id) ON DELETE SET NULL,
  product_name     text        NOT NULL,
  quantity         integer     NOT NULL DEFAULT 1,
  price_at_time    numeric(10,2) NOT NULL,
  subtotal         numeric(10,2) NOT NULL
);

-- 4. BOOKINGS
CREATE TABLE IF NOT EXISTS public.wb_bookings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id          uuid        REFERENCES public.wb_sites(id) ON DELETE CASCADE NOT NULL,
  product_id       uuid        REFERENCES public.wb_products(id) ON DELETE CASCADE NOT NULL,
  order_id         uuid        REFERENCES public.wb_orders(id) ON DELETE CASCADE,
  customer_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name    text,
  start_time       timestamptz NOT NULL,
  end_time         timestamptz NOT NULL,
  status           text        DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at       timestamptz DEFAULT now() NOT NULL
);

-- ── RLS POLICIES ─────────────────────────────────────────────────────────────
ALTER TABLE public.wb_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wb_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wb_bookings ENABLE ROW LEVEL SECURITY;

-- Products: Site owners manage their products
CREATE POLICY "Site owners manage products" ON public.wb_products FOR ALL
USING (EXISTS (SELECT 1 FROM public.wb_sites WHERE id = wb_products.site_id AND owner_id = auth.uid()));

-- Products: Public can view published products
CREATE POLICY "Public can view published products" ON public.wb_products FOR SELECT
USING (status = 'published');

-- Orders: Site owners manage their orders
CREATE POLICY "Site owners manage orders" ON public.wb_orders FOR ALL
USING (EXISTS (SELECT 1 FROM public.wb_sites WHERE id = wb_orders.site_id AND owner_id = auth.uid()));

-- Orders: Customers can view their own orders
CREATE POLICY "Customers view their own orders" ON public.wb_orders FOR SELECT
USING (customer_id = auth.uid());

-- Order Items: Site owners manage items
CREATE POLICY "Site owners manage order items" ON public.wb_order_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.wb_orders WHERE id = wb_order_items.order_id AND site_id IN (SELECT id FROM public.wb_sites WHERE owner_id = auth.uid())));

-- Bookings: Site owners manage bookings
CREATE POLICY "Site owners manage bookings" ON public.wb_bookings FOR ALL
USING (EXISTS (SELECT 1 FROM public.wb_sites WHERE id = wb_bookings.site_id AND owner_id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wb_products_site_id ON public.wb_products (site_id);
CREATE INDEX IF NOT EXISTS idx_wb_products_slug ON public.wb_products (slug);
CREATE INDEX IF NOT EXISTS idx_wb_orders_site_id ON public.wb_orders (site_id);
CREATE INDEX IF NOT EXISTS idx_wb_orders_customer_id ON public.wb_orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_wb_bookings_product_id ON public.wb_bookings (product_id);
CREATE INDEX IF NOT EXISTS idx_wb_bookings_site_id ON public.wb_bookings (site_id);
