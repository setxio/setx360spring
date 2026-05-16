-- =============================================================================
-- FIX: Signup Constraints — Profiles Role + Stores Category
-- Date: 2026-05-12
-- Fixes: Missing roles in profiles CHECK, mismatched categories in stores CHECK,
--        and missing columns referenced by LabsWizard signup flow.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES: Expand role CHECK to include all frontend-sent roles
-- ─────────────────────────────────────────────────────────────────────────────
-- The SignUpFlow sends: resident, business, chamber, official, artist, venue,
-- media, non_profit, church, guest
-- The provision-from-setxio function sets: merchant
-- All verified variants (v_*) are also needed for the verification system.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN (
  'admin',
  'resident',   'v_resident',
  'business',   'v_business',
  'official',   'v_official',
  'chamber',    'v_chamber',
  'venue',      'v_venue',
  'media',      'v_media',
  'non_profit', 'v_non_profit',
  'church',     'v_church',
  'artist',     'v_artist',
  'guest',
  'merchant'
));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. STORES: Expand category CHECK to accept both legacy and UI-sent values
-- ─────────────────────────────────────────────────────────────────────────────
-- The LabsWizard sends: 'Retail', 'Food', 'Services', 'Auto', 'Real Estate'
-- The StoreFrontEditor/StoresDirectory use: 'Health & Beauty', 'Beauty',
-- 'Clothing & Apparel', 'Jewelry & Accessories', 'Sporting Goods', etc.
-- The original schema had: 'artisan', 'food', 'services', 'retail', 'entertainment'

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_category_check;
ALTER TABLE public.stores ADD CONSTRAINT stores_category_check CHECK (category IN (
  -- Legacy lowercase values
  'artisan', 'food', 'services', 'retail', 'entertainment',
  -- UI-sent values (LabsWizard, StoreFrontEditor, StoresDirectory)
  'Retail', 'Food', 'Services', 'Auto', 'Real Estate',
  'Health & Beauty', 'Beauty', 'Clothing & Apparel',
  'Jewelry & Accessories', 'Sporting Goods', 'Groceries',
  'Technology', 'Home & Garden', 'Pets', 'Books & Media',
  'Toys & Games', 'Office Supplies', 'Automotive Parts',
  'Arts & Crafts', 'Musical Instruments', 'Electronics',
  -- Catch-all for edge cases
  'Other'
));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. STORES: Add missing columns referenced by the LabsWizard INSERT
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS total_sales NUMERIC DEFAULT 0;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS source TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. STORES TYPE: Also relax the type constraint (original was too strict)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_type_check;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Reload PostgREST schema cache
-- ─────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
