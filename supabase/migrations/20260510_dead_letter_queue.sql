-- =============================================================================
-- SETX 360 — Phase 6: Dead Letter Queue & Whisper Insights
-- When cross-system webhook fan-out fails (Partner CSM POS unreachable),
-- the failed payload is logged here for retry and merchant notification.
-- =============================================================================

-- 1. Dead Letter Queue (DLQ)
--    Stores all failed webhook deliveries for retry by dlq-processor cron.
CREATE TABLE IF NOT EXISTS public.webhook_dlq (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID        REFERENCES public.orders(id) ON DELETE SET NULL,
    tenant_id       UUID        REFERENCES public.partner_csm_tenants(id) ON DELETE CASCADE,

    -- The original POST payload that failed to deliver
    payload         JSONB       NOT NULL,

    -- Retry tracking
    attempt_count   INT         NOT NULL DEFAULT 1,
    max_attempts    INT         NOT NULL DEFAULT 3,
    last_error      TEXT,
    next_retry_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 minutes', -- initial backoff

    -- Lifecycle
    status          TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'retrying', 'resolved', 'abandoned')),
    resolved_at     TIMESTAMPTZ,
    resolution_note TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for the retry cron (dlq-processor)
CREATE INDEX IF NOT EXISTS idx_dlq_status_retry
    ON public.webhook_dlq (next_retry_at ASC)
    WHERE status IN ('pending', 'retrying');

CREATE INDEX IF NOT EXISTS idx_dlq_tenant_id     ON public.webhook_dlq (tenant_id);
CREATE INDEX IF NOT EXISTS idx_dlq_order_id      ON public.webhook_dlq (order_id);

-- 2. Whisper Insights
--    Human-readable alerts surfaced in the Partner CSM merchant dashboard.
--    Generated when sync failures occur, when moderation strikes are issued,
--    or when any critical platform event requires merchant attention.
CREATE TABLE IF NOT EXISTS public.whisper_insights (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID        REFERENCES public.partner_csm_tenants(id) ON DELETE CASCADE,

    -- Insight content
    title       TEXT        NOT NULL,
    body        TEXT        NOT NULL,
    severity    TEXT        NOT NULL DEFAULT 'info'
                            CHECK (severity IN ('info', 'warning', 'critical')),
    insight_type TEXT       DEFAULT 'sync_failure'
                            CHECK (insight_type IN ('sync_failure', 'moderation_flag', 'fee_clawback', 'system_alert', 'manual')),

    -- Action items (optional deep links for the merchant dashboard)
    action_url  TEXT,       -- e.g., '/dashboard/orders/{order_id}'
    action_label TEXT,      -- e.g., 'View Order' or 'Review Item'

    -- Read state
    is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMPTZ,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whisper_insights_tenant_unread
    ON public.whisper_insights (tenant_id, created_at DESC)
    WHERE is_read = FALSE;

-- 3. Updated_at trigger for DLQ
CREATE OR REPLACE FUNCTION update_webhook_dlq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_webhook_dlq_updated_at ON public.webhook_dlq;
CREATE TRIGGER trg_webhook_dlq_updated_at
    BEFORE UPDATE ON public.webhook_dlq
    FOR EACH ROW EXECUTE FUNCTION update_webhook_dlq_updated_at();

-- 4. Enable RLS
ALTER TABLE public.webhook_dlq       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whisper_insights  ENABLE ROW LEVEL SECURITY;

-- Admins can see and manage all DLQ entries
CREATE POLICY "Admins can manage DLQ" ON public.webhook_dlq
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admins can see all whisper insights
CREATE POLICY "Admins can manage whisper insights" ON public.whisper_insights
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Merchants can read whisper insights for their tenant
-- (Tenant lookup is via stores they own — stores link to csm_tenant_id)
CREATE POLICY "Merchants can view their whisper insights" ON public.whisper_insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.owner_id = auth.uid()
              AND s.csm_tenant_id = whisper_insights.tenant_id
        )
    );

CREATE POLICY "Merchants can mark whispers as read" ON public.whisper_insights
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.owner_id = auth.uid()
              AND s.csm_tenant_id = whisper_insights.tenant_id
        )
    )
    WITH CHECK (is_read = TRUE); -- Can only flip to read, never back to unread

-- 5. Helper RPC: Get pending retry count (for admin dashboard badge)
CREATE OR REPLACE FUNCTION public.get_dlq_summary()
RETURNS TABLE (
    pending_count   BIGINT,
    abandoned_count BIGINT,
    resolved_count  BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE status IN ('pending', 'retrying')) AS pending_count,
        COUNT(*) FILTER (WHERE status = 'abandoned')             AS abandoned_count,
        COUNT(*) FILTER (WHERE status = 'resolved')              AS resolved_count
    FROM public.webhook_dlq;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dlq_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dlq_summary() TO service_role;
