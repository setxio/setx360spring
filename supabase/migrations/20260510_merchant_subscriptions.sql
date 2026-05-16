-- =============================================================================
-- SETX 360 — Merchant Subscriptions
-- Mirrors the subscription plan from setx.io onto SETX 360 so the master
-- node knows each merchant's billing tier. setx.io is the billing authority;
-- this table is populated/updated by the sync-subscription edge function.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.merchant_subscriptions (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id                UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    tenant_id               UUID        REFERENCES public.partner_csm_tenants(id) ON DELETE SET NULL,
    profile_id              UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Billing plan (mirrors setx.io sites.subscription_plan)
    plan                    TEXT        NOT NULL DEFAULT 'free'
                                        CHECK (plan IN ('free','starter','pro','enterprise')),
    status                  TEXT        NOT NULL DEFAULT 'trialing'
                                        CHECK (status IN ('active','past_due','cancelled','trialing','incomplete')),

    -- Feature gates based on plan
    max_pos_terminals       INT         DEFAULT 1,
    max_bridge_items        INT         DEFAULT 50,
    max_monthly_orders      INT         DEFAULT 100,
    ad_credits_monthly      INT         DEFAULT 0,  -- Free ad impressions per billing cycle

    -- Stripe subscription data (billing lives on setx.io side)
    stripe_subscription_id  TEXT,
    stripe_customer_id      TEXT,
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    trial_ends_at           TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,

    -- Sync metadata
    last_synced_at          TIMESTAMPTZ DEFAULT NOW(),
    sync_source             TEXT        DEFAULT 'setxio_webhook',

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One active subscription per store
    UNIQUE (store_id)
);

-- Plan feature gate defaults
CREATE OR REPLACE FUNCTION public.get_plan_features(p_plan TEXT)
RETURNS TABLE (
    max_pos_terminals   INT,
    max_bridge_items    INT,
    max_monthly_orders  INT,
    ad_credits_monthly  INT
)
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    RETURN QUERY SELECT
        CASE p_plan
            WHEN 'free'       THEN 1
            WHEN 'starter'    THEN 2
            WHEN 'pro'        THEN 5
            WHEN 'enterprise' THEN 999
            ELSE 1
        END,
        CASE p_plan
            WHEN 'free'       THEN 10
            WHEN 'starter'    THEN 100
            WHEN 'pro'        THEN 500
            WHEN 'enterprise' THEN 9999
            ELSE 10
        END,
        CASE p_plan
            WHEN 'free'       THEN 50
            WHEN 'starter'    THEN 300
            WHEN 'pro'        THEN 2000
            WHEN 'enterprise' THEN 999999
            ELSE 50
        END,
        CASE p_plan
            WHEN 'free'       THEN 0
            WHEN 'starter'    THEN 500
            WHEN 'pro'        THEN 2000
            WHEN 'enterprise' THEN 10000
            ELSE 0
        END;
END;
$$;

-- Trigger to auto-populate feature gates when plan changes
CREATE OR REPLACE FUNCTION public.apply_plan_features()
RETURNS TRIGGER AS $$
DECLARE v_features RECORD;
BEGIN
    SELECT * INTO v_features FROM public.get_plan_features(NEW.plan);
    NEW.max_pos_terminals  := v_features.max_pos_terminals;
    NEW.max_bridge_items   := v_features.max_bridge_items;
    NEW.max_monthly_orders := v_features.max_monthly_orders;
    NEW.ad_credits_monthly := v_features.ad_credits_monthly;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_merchant_sub_plan_features ON public.merchant_subscriptions;
CREATE TRIGGER trg_merchant_sub_plan_features
    BEFORE INSERT OR UPDATE OF plan ON public.merchant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.apply_plan_features();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_merchant_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_merchant_sub_updated_at ON public.merchant_subscriptions;
CREATE TRIGGER trg_merchant_sub_updated_at
    BEFORE UPDATE ON public.merchant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_merchant_subscriptions_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_merchant_sub_store_id   ON public.merchant_subscriptions (store_id);
CREATE INDEX IF NOT EXISTS idx_merchant_sub_tenant_id  ON public.merchant_subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_sub_status     ON public.merchant_subscriptions (status);

-- RLS
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all subscriptions" ON public.merchant_subscriptions
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Merchants can view own subscription" ON public.merchant_subscriptions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.stores WHERE id = merchant_subscriptions.store_id AND owner_id = auth.uid())
    );

GRANT SELECT ON public.merchant_subscriptions TO authenticated;
GRANT ALL ON public.merchant_subscriptions TO service_role;
