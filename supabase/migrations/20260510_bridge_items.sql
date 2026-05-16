-- =============================================================================
-- SETX 360 — Phase 3: Bridge Items (Polymorphic Item Schema)
-- All inventory pushed UP from Partner CSM nodes lands here first.
-- Items are quarantined in 'pending_moderation' until Guardian AI clears them.
-- Three item types supported: retail, menu (restaurant), service (scheduled).
-- =============================================================================

-- 1. Polymorphic Item Table
CREATE TABLE IF NOT EXISTS public.bridge_items (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID        NOT NULL REFERENCES public.partner_csm_tenants(id) ON DELETE CASCADE,
    store_id            UUID        REFERENCES public.stores(id) ON DELETE SET NULL,

    -- Core Classification
    item_type           TEXT        NOT NULL CHECK (item_type IN ('retail', 'menu', 'service')),
    name                TEXT        NOT NULL,
    description         TEXT,
    price               DECIMAL(12,2),
    currency            TEXT        DEFAULT 'USD',

    -- Polymorphic Metadata (JSONB handles all item type variations)
    -- retail:  { sku, barcode, stock_quantity, variants: [...], images: [...] }
    -- menu:    { modifiers: [...], category, allergens, prep_time_min, images: [...] }
    -- service: { duration_min, availability_blocks: [...], service_area, booking_url }
    metadata            JSONB       DEFAULT '{}',

    -- Images stored as URL array for moderation review
    image_urls          TEXT[]      DEFAULT '{}',

    -- External tracking (for sync deduplication)
    external_id         TEXT,
    external_source     TEXT,       -- 'shopify', 'woocommerce', 'square', 'manual'

    -- Moderation State — all items start quarantined
    moderation_status   TEXT        NOT NULL DEFAULT 'pending_moderation'
                                    CHECK (moderation_status IN ('pending_moderation', 'live', 'flagged', 'archived')),
    moderation_reason   TEXT,       -- Why it was flagged (from Guardian AI)
    ai_metadata         JSONB       DEFAULT '{}', -- Raw Guardian AI analysis result

    -- Vector Search — 768-dim to match existing posts/events embedding schema
    embedding           vector(768),

    -- Audit
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dedup constraint: one item per external ID per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_bridge_items_external_dedup
    ON public.bridge_items (tenant_id, external_source, external_id)
    WHERE external_id IS NOT NULL;

-- HNSW vector index — matches the pattern from 20260501180000_vector_search_infra.sql
CREATE INDEX IF NOT EXISTS idx_bridge_items_embedding
    ON public.bridge_items USING hnsw (embedding vector_cosine_ops);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_bridge_items_tenant_id         ON public.bridge_items (tenant_id);
CREATE INDEX IF NOT EXISTS idx_bridge_items_store_id          ON public.bridge_items (store_id);
CREATE INDEX IF NOT EXISTS idx_bridge_items_moderation_status ON public.bridge_items (moderation_status);
CREATE INDEX IF NOT EXISTS idx_bridge_items_item_type         ON public.bridge_items (item_type);

-- 2. Updated_at trigger
CREATE OR REPLACE FUNCTION update_bridge_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bridge_items_updated_at ON public.bridge_items;
CREATE TRIGGER trg_bridge_items_updated_at
    BEFORE UPDATE ON public.bridge_items
    FOR EACH ROW EXECUTE FUNCTION update_bridge_items_updated_at();

-- 3. Enable RLS
ALTER TABLE public.bridge_items ENABLE ROW LEVEL SECURITY;

-- Public can only see live items (post-moderation)
CREATE POLICY "Public can view live bridge items" ON public.bridge_items
    FOR SELECT USING (moderation_status = 'live');

-- Admins can see and manage everything
CREATE POLICY "Admins can manage all bridge items" ON public.bridge_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Store owners can view their own items regardless of status
CREATE POLICY "Store owners can view their items" ON public.bridge_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = bridge_items.store_id
              AND stores.owner_id = auth.uid()
        )
    );

-- 4. Extend the existing vector search RPC to include bridge_items
--    Adds 'product', 'menu_item', 'service' to the unified search index
CREATE OR REPLACE FUNCTION public.search_platform_content_vector_fallback(
    search_query    TEXT,
    query_embedding vector(768) DEFAULT NULL,
    limit_count     INT DEFAULT 10
)
RETURNS TABLE (
    id          UUID,
    type        TEXT,
    title       TEXT,
    content     TEXT,
    location    TEXT,
    created_at  TIMESTAMPTZ,
    similarity  FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF query_embedding IS NOT NULL THEN
        RETURN QUERY
        (
            SELECT p.id, 'post'::TEXT, NULL::TEXT, p.content, p.event_location, p.created_at,
                   (1 - (p.embedding <=> query_embedding))::FLOAT
            FROM public.posts p
            WHERE (p.is_nsfw IS FALSE OR p.is_nsfw IS NULL) AND p.embedding IS NOT NULL
            ORDER BY p.embedding <=> query_embedding LIMIT limit_count
        )
        UNION ALL
        (
            SELECT e.id, 'event'::TEXT, e.title, e.description, e.location, e.created_at,
                   (1 - (e.embedding <=> query_embedding))::FLOAT
            FROM public.events e
            WHERE e.is_public IS TRUE AND e.embedding IS NOT NULL
            ORDER BY e.embedding <=> query_embedding LIMIT limit_count
        )
        UNION ALL
        (
            SELECT bi.id, bi.item_type, bi.name, bi.description, NULL::TEXT, bi.created_at,
                   (1 - (bi.embedding <=> query_embedding))::FLOAT
            FROM public.bridge_items bi
            WHERE bi.moderation_status = 'live' AND bi.embedding IS NOT NULL
            ORDER BY bi.embedding <=> query_embedding LIMIT limit_count
        )
        ORDER BY similarity DESC
        LIMIT limit_count;
    ELSE
        RETURN QUERY
        (
            SELECT p.id, 'post'::TEXT, NULL::TEXT, p.content, p.event_location, p.created_at, 0::FLOAT
            FROM public.posts p
            WHERE p.content ILIKE '%' || search_query || '%'
              AND (p.is_nsfw IS FALSE OR p.is_nsfw IS NULL)
            LIMIT limit_count
        )
        UNION ALL
        (
            SELECT e.id, 'event'::TEXT, e.title, e.description, e.location, e.created_at, 0::FLOAT
            FROM public.events e
            WHERE (e.title ILIKE '%' || search_query || '%' OR e.description ILIKE '%' || search_query || '%')
              AND e.is_public IS TRUE
            LIMIT limit_count
        )
        UNION ALL
        (
            SELECT bi.id, bi.item_type, bi.name, bi.description, NULL::TEXT, bi.created_at, 0::FLOAT
            FROM public.bridge_items bi
            WHERE (bi.name ILIKE '%' || search_query || '%' OR bi.description ILIKE '%' || search_query || '%')
              AND bi.moderation_status = 'live'
            LIMIT limit_count
        )
        ORDER BY created_at DESC
        LIMIT limit_count;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_platform_content_vector_fallback(TEXT, vector(768), INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_platform_content_vector_fallback(TEXT, vector(768), INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_platform_content_vector_fallback(TEXT, vector(768), INT) TO anon;
