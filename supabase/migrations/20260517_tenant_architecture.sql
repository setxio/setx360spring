-- =============================================================================
-- SETX.io B2B SaaS: Multi-Tenant Architecture
-- =============================================================================

-- 1. Create the tenants table for merchants
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    business_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- Used for [slug].setx.io
    stripe_connect_id TEXT UNIQUE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create the custom_domains mapping table for Vercel Edge resolution
CREATE TABLE IF NOT EXISTS public.custom_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    domain_name TEXT UNIQUE NOT NULL, -- e.g., 'myboutique.com'
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Tenants
-- Anyone can read active tenants (required for public storefronts)
CREATE POLICY "Public can view active tenants" ON public.tenants
    FOR SELECT USING (is_active = true);

-- Owners can view, update, and insert their own tenant configurations
CREATE POLICY "Owners manage their tenants" ON public.tenants
    FOR ALL USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- 5. RLS Policies for Custom Domains
-- Public needs to read custom domains for Edge Middleware resolution
CREATE POLICY "Public can view verified custom domains" ON public.custom_domains
    FOR SELECT USING (true); -- Read-only for mapping

-- Owners manage their own custom domains (via join to tenants)
CREATE POLICY "Owners manage custom domains" ON public.custom_domains
    FOR ALL USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE owner_id = auth.uid()
        )
    );

-- 6. Performance Indexes for Edge Lookup
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_custom_domains_name ON public.custom_domains(domain_name);
