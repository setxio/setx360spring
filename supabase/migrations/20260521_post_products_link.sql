-- Phase 2: Shoppable Social Feeds (Commerce Integration)
-- Create a join table to link products directly to social posts

CREATE TABLE IF NOT EXISTS public.post_products (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, product_id)
);

-- Enable RLS
ALTER TABLE public.post_products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view post_products"
  ON public.post_products FOR SELECT
  USING (true);

CREATE POLICY "Authors can link products to their posts"
  ON public.post_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE id = post_products.post_id 
      AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Authors can unlink products from their posts"
  ON public.post_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE id = post_products.post_id 
      AND profile_id = auth.uid()
    )
  );

-- Create an index to speed up join queries when rendering the feed
CREATE INDEX IF NOT EXISTS idx_post_products_post_id ON public.post_products(post_id);
CREATE INDEX IF NOT EXISTS idx_post_products_product_id ON public.post_products(product_id);

-- Explicitly notify postgrest to reload schema to recognize the foreign key relationships
NOTIFY pgrst, 'reload schema';
