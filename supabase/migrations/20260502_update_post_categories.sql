-- Migration: Update Posts Category Constraint
-- The current constraint is too restrictive and prevents users from posting to 'Everybody' or 'Groups'.

DO $$
BEGIN
    -- Drop the old constraint
    ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_check;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_category_check 
CHECK (category IN (
    'Everybody', 'Following', 'Groups', 'News', 'Events', 'Faith', 
    'Official', 'Shopping', 'Services', 'Non Profit', 'General',
    'Community', 'Business', 'Sports', 'Tech', 'Deals', 'Hobbies', 'Recipes',
    'Vibes', 'Trending', 'Hot Deals', 'New Arrivals'
));
