-- SETX360 SEED DATA
-- Purpose: Initial mock content for Jefferson/Orange County Environments

--------------------------------------------------------------------------------
-- 1. FEATURED STORES
--------------------------------------------------------------------------------
INSERT INTO public.stores (id, name, description, type, category, location, is_verified, image_url)
VALUES 
(uuid_generate_v4(), 'Roasters Co.', 'Premium local coffee roasters from the heart of Beaumont.', 'all', 'food', 'Beaumont, TX', true, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=500&fit=crop'),
(uuid_generate_v4(), 'Clay & Co.', 'Handcrafted ceramics and home decor inspired by the Gulf Coast.', 'physical', 'artisan', 'Vidor, TX', true, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&h=500&fit=crop'),
(uuid_generate_v4(), 'Green Goods', 'Eco-friendly essentials for a sustainable SETX lifestyle.', 'online', 'retail', 'Orange, TX', true, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&h=500&fit=crop');

--------------------------------------------------------------------------------
-- 2. FEATURED PRODUCTS
--------------------------------------------------------------------------------
INSERT INTO public.products (store_id, name, description, price, image_urls)
SELECT id, 'Artisan Coffee Beans', 'Single origin beans roasted in small batches.', 18.99, ARRAY['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop']
FROM public.stores WHERE name = 'Roasters Co.';

INSERT INTO public.products (store_id, name, description, price, image_urls)
SELECT id, 'Handmade Ceramic Mug', 'Individually thrown and glazed by local artists.', 24.50, ARRAY['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop']
FROM public.stores WHERE name = 'Clay & Co.';

INSERT INTO public.products (store_id, name, description, price, image_urls)
SELECT id, 'Eco-friendly Tote', 'Durable canvas bag for the local farmers market.', 15.00, ARRAY['https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop']
FROM public.stores WHERE name = 'Green Goods';

--------------------------------------------------------------------------------
-- 3. MOCK SOCIAL POSTS
--------------------------------------------------------------------------------
-- Note: These are 'Platform News' posts using a NULL profile_id or a system ID if available
INSERT INTO public.posts (content, type, media_urls)
VALUES 
('Welcome to SETX360! 🚀 This is your portal to everything local in Jefferson & Orange counties. #SETXPride', 'news', ARRAY['https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=400&fit=crop']),
('VOTE: Which city in the Golden Triangle has the best Saturday morning vibes?', 'poll', '{}');
