-- =============================================================================
-- SETX 360 — Sample Merchant Seed
-- Run this to create a "Live Demo" environment for testing the Bridge.
-- =============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_store_id  UUID;
    v_owner_id  UUID := 'cae1c6f0-f813-41c0-b1c4-f5bc68e1abf7'; -- Valid Profile ID
BEGIN
    -- 1. Create a Sample Partner Tenant (setx.io node)
    INSERT INTO public.partner_csm_tenants (
        tenant_slug,
        display_name,
        base_url,
        api_key_hash,
        stripe_account_id,
        status
    ) VALUES (
        'beaumont-bbq',
        'Beaumont BBQ POS',
        'https://beaumont-bbq.setx.io',
        'mock_hash_for_demo',
        'acct_demo_12345',
        'active'
    )
    ON CONFLICT (tenant_slug) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING id INTO v_tenant_id;

    -- 2. Create a Sample Store linked to this tenant
    SELECT id INTO v_store_id FROM public.stores WHERE name = 'Cajun Gourmet' LIMIT 1;
    
    IF v_store_id IS NULL THEN
        INSERT INTO public.stores (
            name,
            category,
            owner_id,
            csm_tenant_id,
            stripe_account_id,
            image_url
        ) VALUES (
            'Cajun Gourmet',
            'food',
            v_owner_id,
            v_tenant_id,
            'acct_demo_12345',
            'https://images.unsplash.com/photo-1559339352-11d035aa65de'
        )
        RETURNING id INTO v_store_id;
    ELSE
        UPDATE public.stores SET csm_tenant_id = v_tenant_id WHERE id = v_store_id;
    END IF;

    -- 3. Create a Merchant Subscription (Starter Plan)
    INSERT INTO public.merchant_subscriptions (
        store_id,
        tenant_id,
        plan,
        status
    ) VALUES (
        v_store_id,
        v_tenant_id,
        'starter',
        'active'
    )
    ON CONFLICT (store_id) DO NOTHING;

    RAISE NOTICE '✅ Demo Merchant "Cajun Gourmet" created and linked to "beaumont-bbq"';
END $$;
