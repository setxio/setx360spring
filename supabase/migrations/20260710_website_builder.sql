-- =============================================================================
-- SETX 360 — Website Builder (wb_*) Schema
-- Allows registered users to create and manage standalone websites
-- hosted on *.setx360.com subdomains with per-site storage buckets,
-- a WordPress-like CMS dashboard, and SETX 360 SSO subscriber system.
-- =============================================================================

-- --------------------------------------------------------
-- 1. wb_sites — Core site record
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wb_sites (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name             text        NOT NULL,
  subdomain        text        NOT NULL UNIQUE,
  tagline          text,
  status           text        DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'building')),
  plan             text        DEFAULT 'free'   CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  storage_bucket   text,
  white_label_config jsonb     DEFAULT '{}'::jsonb,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.wb_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage their own sites"
  ON public.wb_sites FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Sites are publicly readable"
  ON public.wb_sites FOR SELECT
  USING (status = 'active');

-- --------------------------------------------------------
-- 2. wb_site_subscribers — Created BEFORE posts/pages
--    so their RLS policies can reference this table.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wb_site_subscribers (
  id            uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       uuid  REFERENCES public.wb_sites(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid  REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role          text  DEFAULT 'subscriber'
                      CHECK (role IN ('subscriber', 'contributor', 'editor', 'admin')),
  status        text  DEFAULT 'active' CHECK (status IN ('active', 'banned', 'pending')),
  subscribed_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(site_id, user_id)
);

ALTER TABLE public.wb_site_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
  ON public.wb_site_subscribers FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Site owners can manage all subscribers"
  ON public.wb_site_subscribers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.wb_sites
      WHERE id = wb_site_subscribers.site_id
        AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Subscriber list is viewable by site team"
  ON public.wb_site_subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wb_sites s
      WHERE s.id = wb_site_subscribers.site_id
        AND (s.owner_id = auth.uid() OR auth.uid() = wb_site_subscribers.user_id)
    )
  );

-- --------------------------------------------------------
-- 3. wb_posts — Blog posts
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wb_posts (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id            uuid        REFERENCES public.wb_sites(id) ON DELETE CASCADE NOT NULL,
  author_id          uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  title              text        NOT NULL,
  slug               text        NOT NULL,
  content            text,
  excerpt            text,
  status             text        DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'trash')),
  featured_image_url text,
  categories         text[]      DEFAULT '{}',
  tags               text[]      DEFAULT '{}',
  published_at       timestamptz,
  created_at         timestamptz DEFAULT now() NOT NULL,
  updated_at         timestamptz DEFAULT now() NOT NULL,
  UNIQUE(site_id, slug)
);

ALTER TABLE public.wb_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site team can manage posts"
  ON public.wb_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.wb_sites s
      WHERE s.id = wb_posts.site_id
        AND (
          s.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.wb_site_subscribers sub
            WHERE sub.site_id = s.id
              AND sub.user_id = auth.uid()
              AND sub.role IN ('admin', 'editor', 'contributor')
          )
        )
    )
  );

CREATE POLICY "Published posts are public"
  ON public.wb_posts FOR SELECT
  USING (status = 'published');

-- --------------------------------------------------------
-- 4. wb_pages — Static pages
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wb_pages (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id        uuid        REFERENCES public.wb_sites(id) ON DELETE CASCADE NOT NULL,
  author_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  title          text        NOT NULL,
  slug           text        NOT NULL,
  content        text,
  status         text        DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'trash')),
  parent_page_id uuid        REFERENCES public.wb_pages(id) ON DELETE SET NULL,
  template       text        DEFAULT 'default',
  sort_order     int         DEFAULT 0,
  created_at     timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL,
  UNIQUE(site_id, slug)
);

ALTER TABLE public.wb_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site team can manage pages"
  ON public.wb_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.wb_sites s
      WHERE s.id = wb_pages.site_id
        AND (
          s.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.wb_site_subscribers sub
            WHERE sub.site_id = s.id
              AND sub.user_id = auth.uid()
              AND sub.role IN ('admin', 'editor')
          )
        )
    )
  );

CREATE POLICY "Published pages are public"
  ON public.wb_pages FOR SELECT
  USING (status = 'published');

-- --------------------------------------------------------
-- 5. wb_media — Media library per site
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wb_media (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     uuid        REFERENCES public.wb_sites(id) ON DELETE CASCADE NOT NULL,
  uploader_id uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name   text        NOT NULL,
  file_url    text        NOT NULL,
  file_type   text,
  file_size   bigint,
  alt_text    text,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.wb_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site team can manage media"
  ON public.wb_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.wb_sites s
      WHERE s.id = wb_media.site_id
        AND (
          s.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.wb_site_subscribers sub
            WHERE sub.site_id = s.id
              AND sub.user_id = auth.uid()
              AND sub.role IN ('admin', 'editor', 'contributor')
          )
        )
    )
  );

CREATE POLICY "Media is publicly readable"
  ON public.wb_media FOR SELECT
  USING (true);

-- --------------------------------------------------------
-- 6. wb_site_settings — One-to-one with wb_sites
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wb_site_settings (
  site_id              uuid    PRIMARY KEY REFERENCES public.wb_sites(id) ON DELETE CASCADE,
  timezone             text    DEFAULT 'America/Chicago',
  posts_per_page       int     DEFAULT 10,
  homepage_type        text    DEFAULT 'latest_posts' CHECK (homepage_type IN ('latest_posts', 'static_page')),
  homepage_page_id     uuid    REFERENCES public.wb_pages(id) ON DELETE SET NULL,
  comment_moderation   boolean DEFAULT true,
  allow_subscriptions  boolean DEFAULT true,
  ga_tracking_id       text,
  contact_form_email   text,
  updated_at           timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.wb_site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage settings"
  ON public.wb_site_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.wb_sites WHERE id = wb_site_settings.site_id AND owner_id = auth.uid())
  );

-- --------------------------------------------------------
-- 7. wb_menu_items — Navigation menus
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wb_menu_items (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     uuid  REFERENCES public.wb_sites(id) ON DELETE CASCADE NOT NULL,
  label       text  NOT NULL,
  url         text  NOT NULL,
  sort_order  int   DEFAULT 0,
  parent_id   uuid  REFERENCES public.wb_menu_items(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.wb_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site team can manage menus"
  ON public.wb_menu_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.wb_sites WHERE id = wb_menu_items.site_id AND owner_id = auth.uid())
  );

CREATE POLICY "Menus are publicly readable"
  ON public.wb_menu_items FOR SELECT USING (true);

-- --------------------------------------------------------
-- 8. Indexes for performance
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_wb_sites_owner         ON public.wb_sites (owner_id);
CREATE INDEX IF NOT EXISTS idx_wb_sites_subdomain      ON public.wb_sites (subdomain);
CREATE INDEX IF NOT EXISTS idx_wb_posts_site_id        ON public.wb_posts (site_id);
CREATE INDEX IF NOT EXISTS idx_wb_posts_status         ON public.wb_posts (status);
CREATE INDEX IF NOT EXISTS idx_wb_pages_site_id        ON public.wb_pages (site_id);
CREATE INDEX IF NOT EXISTS idx_wb_media_site_id        ON public.wb_media (site_id);
CREATE INDEX IF NOT EXISTS idx_wb_subscribers_site_id  ON public.wb_site_subscribers (site_id);
CREATE INDEX IF NOT EXISTS idx_wb_subscribers_user_id  ON public.wb_site_subscribers (user_id);

-- --------------------------------------------------------
-- 9. Auto-updated_at trigger
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.wb_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wb_sites_updated_at     BEFORE UPDATE ON public.wb_sites         FOR EACH ROW EXECUTE FUNCTION public.wb_set_updated_at();
CREATE TRIGGER trg_wb_posts_updated_at     BEFORE UPDATE ON public.wb_posts         FOR EACH ROW EXECUTE FUNCTION public.wb_set_updated_at();
CREATE TRIGGER trg_wb_pages_updated_at     BEFORE UPDATE ON public.wb_pages         FOR EACH ROW EXECUTE FUNCTION public.wb_set_updated_at();
CREATE TRIGGER trg_wb_settings_updated_at  BEFORE UPDATE ON public.wb_site_settings FOR EACH ROW EXECUTE FUNCTION public.wb_set_updated_at();

-- --------------------------------------------------------
-- NOTE: Per-site storage buckets are created dynamically by the
-- `provision-wb-site` Supabase Edge Function when a new wb_site is
-- first entered. The bucket name is stored in wb_sites.storage_bucket.
-- Pattern: wb-{site_id}
-- --------------------------------------------------------
