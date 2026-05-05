-- Migration: Market Schema Enhancements
-- Adds missing columns for better location discovery and product categorization.

-- 1. Add City to Stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS city TEXT;

-- 2. Add Category to Products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. Add Status to Products (if missing)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));

-- 4. Enable RLS for newly added columns if necessary (usually inherited)
-- Ensure public access to these new columns
DROP POLICY IF EXISTS "Public can view product categories" ON public.products;
CREATE POLICY "Public can view product categories" ON public.products FOR SELECT USING (true);
