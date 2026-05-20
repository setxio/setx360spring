-- =============================================================================
-- SETX 360 & SETX.io: Advanced External Protocols (Flare, Zebec, Ondo)
-- =============================================================================

-- 1. Flare Network IoT Telemetry Logs
CREATE TABLE IF NOT EXISTS public.smart_city_telemetry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    flare_proof_hash TEXT UNIQUE NOT NULL,
    verified_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Zebec Protocol Streaming Payroll
CREATE TABLE IF NOT EXISTS public.driver_payroll_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    stream_contract_id TEXT UNIQUE NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    rate_per_second NUMERIC(18, 8) NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Ondo Finance Treasury Yield Allocations
CREATE TABLE IF NOT EXISTS public.treasury_yield_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocated_amount NUMERIC(14, 2) NOT NULL,
    asset_type TEXT DEFAULT 'USDY' NOT NULL,
    estimated_apy NUMERIC(5, 2) NOT NULL,
    daily_yield_generated NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.smart_city_telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_payroll_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_yield_allocations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Telemetry is public for civic transparency
CREATE POLICY "Public can view smart city telemetry" ON public.smart_city_telemetry_logs
    FOR SELECT USING (true);

-- Drivers view their own streams
CREATE POLICY "Drivers view their payroll streams" ON public.driver_payroll_streams
    FOR SELECT USING (driver_id = auth.uid());

-- Treasury yields are public for DUNA transparency
CREATE POLICY "Public can view treasury yield stats" ON public.treasury_yield_allocations
    FOR SELECT USING (true);
