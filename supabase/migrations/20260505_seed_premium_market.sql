-- Migration: Seed Premium Market Data (v2)
-- Populates dummy stores and products with the fixed schema.

DO $$
DECLARE
    v_owner_id UUID;
    v_store_id_1 UUID;
    v_store_id_2 UUID;
BEGIN
    -- 1. Find a profile to be the owner
    SELECT id INTO v_owner_id FROM public.profiles LIMIT 1;
    
    IF v_owner_id IS NULL THEN
        RETURN;
    END IF;

    -- 2. Create Stores
    INSERT INTO public.stores (owner_id, name, bio, category, subcategory, type, address, city, county, zip, image_url, banner_url)
    VALUES (
        v_owner_id,
        'Golden Triangle Artisans',
        'We source the finest local cypress and cedar to create heirloom-quality furniture right here in Beaumont.',
        'retail',
        'Furniture',
        'physical',
        '123 Artisan Way',
        'Beaumont',
        'Jefferson',
        '77701',
        'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=400',
        'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1200'
    ) RETURNING id INTO v_store_id_1;

    INSERT INTO public.stores (owner_id, name, bio, category, subcategory, type, city, county, zip, image_url, banner_url)
    VALUES (
        v_owner_id,
        'Bayou Tech Collective',
        'The Gulf Coast premier destination for gaming rigs and custom workstation solutions.',
        'retail',
        'Computing',
        'online',
        'Port Arthur',
        'Jefferson',
        '77642',
        'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200'
    ) RETURNING id INTO v_store_id_2;

    -- 3. Create Products
    INSERT INTO public.products (store_id, name, description, price, category, status, image_urls)
    VALUES 
    (v_store_id_1, 'Live Edge Cypress Dining Table', 'Hand-finished cypress wood sourced from local bayous. Each table is a unique masterpiece.', 1250.00, 'Home Decor', 'active', ARRAY['https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800']),
    (v_store_id_1, 'Hand-Carved Cedar Rocking Chair', 'Traditional design meets modern comfort. Perfect for porch sitting in the Texas breeze.', 349.99, 'Home Decor', 'active', ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800']),
    (v_store_id_2, 'Bayou Beast Gaming PC', 'RTX 4080, 32GB RAM, 2TB NVMe. Built and tested locally for maximum performance.', 2499.99, 'Electronics', 'active', ARRAY['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800']);

END $$;
