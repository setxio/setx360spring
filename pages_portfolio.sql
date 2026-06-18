-- Create the portfolio table for artists, musicians, and creators
CREATE TABLE IF NOT EXISTS public.artist_portfolio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('track', 'album', 'artwork', 'video')),
    title TEXT NOT NULL,
    description TEXT,
    media_type TEXT NOT NULL CHECK (media_type IN ('external', 'upload')),
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.artist_portfolio ENABLE ROW LEVEL SECURITY;

-- 1. Public can read all portfolio items
CREATE POLICY "Public can view portfolio items"
ON public.artist_portfolio FOR SELECT
USING (true);

-- 2. Only Page Admins can insert portfolio items
CREATE POLICY "Page admins can insert portfolio items"
ON public.artist_portfolio FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.page_members
    WHERE page_id = artist_portfolio.page_id
    AND user_id = auth.uid()
    AND access_level IN ('admin', 'editor')
  )
);

-- 3. Only Page Admins can update portfolio items
CREATE POLICY "Page admins can update portfolio items"
ON public.artist_portfolio FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.page_members
    WHERE page_id = artist_portfolio.page_id
    AND user_id = auth.uid()
    AND access_level IN ('admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.page_members
    WHERE page_id = artist_portfolio.page_id
    AND user_id = auth.uid()
    AND access_level IN ('admin', 'editor')
  )
);

-- 4. Only Page Admins can delete portfolio items
CREATE POLICY "Page admins can delete portfolio items"
ON public.artist_portfolio FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.page_members
    WHERE page_id = artist_portfolio.page_id
    AND user_id = auth.uid()
    AND access_level = 'admin'
  )
);

-- Create a storage bucket for uploaded portfolio media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio_media', 'portfolio_media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for portfolio_media
CREATE POLICY "Public Access to Portfolio Media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'portfolio_media' );

CREATE POLICY "Authenticated Users can upload to Portfolio Media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'portfolio_media' AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own Portfolio Media"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'portfolio_media' AND auth.uid() = owner
);

CREATE POLICY "Users can delete their own Portfolio Media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'portfolio_media' AND auth.uid() = owner
);
