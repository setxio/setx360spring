-- ═══════════════════════════════════════════════════════════════════
-- AUDIT FIX: Role Expansion & Consistency
-- ═══════════════════════════════════════════════════════════════════

-- Update the check constraint on profiles.role to include all frontend types
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN (
  'admin', 
  'resident', 'v_resident', 
  'business', 'v_business', 
  'official', 'v_official', 
  'venue', 'v_venue', 
  'media', 'v_media', 
  'non_profit', 'v_non_profit', 
  'church', 'v_church',
  'artist', 'v_artist',
  'chamber', 'v_chamber',
  'guest'
));

-- ═══════════════════════════════════════════════════════════════════
-- AUDIT FIX: Column Consolidation (Reposts)
-- ═══════════════════════════════════════════════════════════════════

-- Check which repost column is being populated. 
-- In previous logs I saw 'repost_count' being used in SocialFeed.tsx.
-- We will consolidate into 'reposts_count' (plural matches comments_count, likes_count)

-- 1. Sync data from repost_count to reposts_count if needed
UPDATE public.posts SET reposts_count = COALESCE(reposts_count, 0) + COALESCE(repost_count, 0) WHERE repost_count > 0;

-- 2. Drop the redundant column (we will do this after verifying frontend uses the plural)
-- ALTER TABLE public.posts DROP COLUMN IF EXISTS repost_count;
