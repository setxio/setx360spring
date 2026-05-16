-- =============================================================================
-- setx.io — Appointments Table
-- The setx.io-side representation of service bookings.
-- Created when SETX 360 confirms a booking and syncs it down to the POS.
-- Also supports walk-in appointment creation directly at the desk.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id                 UUID        NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,

    -- Service being booked (links to setx.io product that is service-type)
    service_id              UUID        REFERENCES public.products(id) ON DELETE SET NULL,
    service_name            TEXT        NOT NULL,

    -- Customer — supports both platform users and anonymous walk-ins
    customer_name           TEXT        NOT NULL,
    customer_email          TEXT,
    customer_phone          TEXT,
    setx360_customer_id     UUID,       -- SETX 360 profiles.id (null for anonymous)
    setx360_booking_id      UUID,       -- SETX 360 bookings.id (null for walk-ins)

    -- When
    scheduled_at            TIMESTAMPTZ NOT NULL,
    duration_min            INT,
    ends_at                 TIMESTAMPTZ GENERATED ALWAYS AS
                                (scheduled_at + (COALESCE(duration_min, 60) || ' minutes')::INTERVAL) STORED,

    -- Appointment state
    status                  TEXT        NOT NULL DEFAULT 'pending'
                                        CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','no_show')),
    confirmed_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,

    -- Staff assignment (links to pos_operators)
    operator_id             UUID        REFERENCES public.pos_operators(id) ON DELETE SET NULL,

    -- Payment tracking
    price                   DECIMAL(12,2),
    deposit_paid            BOOLEAN     DEFAULT FALSE,
    deposit_amount          DECIMAL(12,2) DEFAULT 0.00,
    payment_method          TEXT        CHECK (payment_method IN ('cash','card','online','deposit_only','complimentary')),
    pos_transaction_id      UUID,       -- Links to orders.id if paid through POS

    -- Notes
    customer_notes          TEXT,
    merchant_notes          TEXT,
    internal_tags           TEXT[]      DEFAULT '{}',

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_site_id        ON public.appointments (site_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at   ON public.appointments (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status         ON public.appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_operator_id    ON public.appointments (operator_id);
CREATE INDEX IF NOT EXISTS idx_appointments_setx360_booking ON public.appointments (setx360_booking_id) WHERE setx360_booking_id IS NOT NULL;

-- Today's schedule view (used by POS staff dashboard)
CREATE OR REPLACE VIEW public.todays_appointments AS
SELECT
    a.*,
    po.name AS operator_name,
    p.name AS service_name_from_product
FROM public.appointments a
LEFT JOIN public.pos_operators po ON po.id = a.operator_id
LEFT JOIN public.products p ON p.id = a.service_id
WHERE DATE(a.scheduled_at AT TIME ZONE 'America/Chicago') = CURRENT_DATE
  AND a.status NOT IN ('cancelled', 'no_show')
ORDER BY a.scheduled_at;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION update_appointments_updated_at();

-- RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site operators can manage appointments" ON public.appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sites s
            WHERE s.id = appointments.site_id
        )
    );

GRANT ALL ON public.appointments TO service_role;
GRANT SELECT ON public.todays_appointments TO service_role;
