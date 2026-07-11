-- =============================================================================
-- SETX 360 — Website Builder Phase 2
-- Adds comments system for wb_sites
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wb_comments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     uuid        REFERENCES public.wb_sites(id) ON DELETE CASCADE NOT NULL,
  post_id     uuid        REFERENCES public.wb_posts(id) ON DELETE CASCADE NOT NULL,
  author_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,       -- fallback for display
  content     text        NOT NULL,
  status      text        DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam')),
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.wb_comments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can submit a comment
CREATE POLICY "Authenticated users can comment"
  ON public.wb_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Authors can see their own pending comments
CREATE POLICY "Authors see their own comments"
  ON public.wb_comments FOR SELECT
  USING (author_id = auth.uid());

-- Approved comments are public
CREATE POLICY "Approved comments are public"
  ON public.wb_comments FOR SELECT
  USING (status = 'approved');

-- Site owners can manage all comments on their sites
CREATE POLICY "Site owners manage comments"
  ON public.wb_comments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.wb_sites WHERE id = wb_comments.site_id AND owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_wb_comments_post_id ON public.wb_comments (post_id);
CREATE INDEX IF NOT EXISTS idx_wb_comments_site_id ON public.wb_comments (site_id);
CREATE INDEX IF NOT EXISTS idx_wb_comments_status  ON public.wb_comments (status);
