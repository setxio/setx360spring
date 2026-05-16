-- =============================================================================
-- SETX 360 — Bookings Table
-- Handles service appointment bookings initiated through the SETX 360
-- marketplace. Syncs to setx.io appointments table on confirmation.
-- Supports: salons, tutors, repair shops, consultants, any service business.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bookings (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who is booking
    customer_id             UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name           TEXT,       -- Populated for non-SETX 360 users
    customer_email          TEXT,
    customer_phone          TEXT,

    -- What they're booking
    store_id                UUID        REFERENCES public.stores(id) ON DELETE CASCADE,
    tenant_id               UUID        REFERENCES public.partner_csm_tenants(id) ON DELETE SET NULL,
    bridge_item_id          UUID        REFERENCES public.bridge_items(id) ON DELETE SET NULL,
    service_name            TEXT        NOT NULL,  -- Denormalized for resilience if item is deleted
    service_description     TEXT,

    -- When
    scheduled_at            TIMESTAMPTZ NOT NULL,
    duration_min            INT,
    timezone                TEXT        DEFAULT 'America/Chicago',

    -- Booking state
    status                  TEXT        NOT NULL DEFAULT 'pending'
                                        CHECK (status IN ('pending','confirmed','completed','cancelled','no_show','rescheduled')),
    cancelled_at            TIMESTAMPTZ,
    cancellation_reason     TEXT,
    rescheduled_from        UUID        REFERENCES public.bookings(id) ON DELETE SET NULL,

    -- Payment
    price                   DECIMAL(12,2),
    currency                TEXT        DEFAULT 'USD',
    deposit_amount          DECIMAL(12,2) DEFAULT 0.00,
    deposit_paid            BOOLEAN     DEFAULT FALSE,
    stripe_payment_intent_id TEXT,
    fully_paid              BOOLEAN     DEFAULT FALSE,

    -- Cross-platform sync
    setxio_appointment_id   UUID,       -- FK to setx.io appointments.id (set on sync)
    synced_to_setxio_at     TIMESTAMPTZ,
    sync_status             TEXT        DEFAULT 'pending'
                                        CHECK (sync_status IN ('pending','synced','failed')),

    -- Staff assignment (synced from setx.io pos_operators)
    assigned_staff_name     TEXT,
    assigned_operator_id    UUID,       -- setx.io pos_operators.id

    -- Notes
    customer_notes          TEXT,
    merchant_notes          TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id    ON public.bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_store_id       ON public.bookings (store_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at   ON public.bookings (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status         ON public.bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id      ON public.bookings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_sync_status    ON public.bookings (sync_status) WHERE sync_status != 'synced';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_bookings_updated_at();

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can cancel own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = customer_id)
    WITH CHECK (status = 'cancelled');

CREATE POLICY "Merchants can view their store bookings" ON public.bookings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.stores WHERE id = bookings.store_id AND owner_id = auth.uid())
    );

CREATE POLICY "Merchants can manage their store bookings" ON public.bookings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.stores WHERE id = bookings.store_id AND owner_id = auth.uid())
    );

CREATE POLICY "Admins can manage all bookings" ON public.bookings
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT, INSERT ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

-- =============================================================================
-- RPC: Get available slots for a bridge item (service)
-- Returns time slots not already taken for a given date
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_available_booking_slots(
    p_bridge_item_id    UUID,
    p_date              DATE,
    p_timezone          TEXT DEFAULT 'America/Chicago'
)
RETURNS TABLE (
    slot_start  TIMESTAMPTZ,
    slot_end    TIMESTAMPTZ,
    is_available BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_duration_min INT;
    v_avail_blocks JSONB;
BEGIN
    -- Get service duration from bridge_items metadata
    SELECT
        (metadata->>'duration_min')::INT,
        metadata->'availability_blocks'
    INTO v_duration_min, v_avail_blocks
    FROM public.bridge_items
    WHERE id = p_bridge_item_id AND item_type = 'service';

    IF v_duration_min IS NULL THEN v_duration_min := 60; END IF;

    -- Return all configured blocks, marking those with conflicting bookings
    RETURN QUERY
    SELECT
        (p_date::TEXT || ' ' || (block->>'start'))::TIMESTAMPTZ AT TIME ZONE p_timezone AS slot_start,
        (p_date::TEXT || ' ' || (block->>'end'))::TIMESTAMPTZ AT TIME ZONE p_timezone AS slot_end,
        NOT EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.bridge_item_id = p_bridge_item_id
              AND b.status NOT IN ('cancelled', 'no_show')
              AND b.scheduled_at < (p_date::TEXT || ' ' || (block->>'end'))::TIMESTAMPTZ AT TIME ZONE p_timezone
              AND (b.scheduled_at + (COALESCE(b.duration_min, v_duration_min) || ' minutes')::INTERVAL)
                  > (p_date::TEXT || ' ' || (block->>'start'))::TIMESTAMPTZ AT TIME ZONE p_timezone
        ) AS is_available
    FROM jsonb_array_elements(COALESCE(v_avail_blocks, '[]'::jsonb)) AS block
    WHERE date_part('dow', p_date) = ANY(
        ARRAY(SELECT jsonb_array_elements_text(block->'days')::INT)
    )
    ORDER BY slot_start;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_booking_slots(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_booking_slots(UUID, DATE, TEXT) TO anon;
