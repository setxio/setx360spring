-- 1. Create media_albums table
CREATE TABLE IF NOT EXISTS public.media_albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    album_type TEXT NOT NULL CHECK (album_type IN ('Album', 'EP')),
    cover_url TEXT,
    release_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Alter media_tracks
ALTER TABLE public.media_tracks 
ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS album_id UUID REFERENCES public.media_albums(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'external',
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. RLS for media_albums
ALTER TABLE public.media_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view media albums"
ON public.media_albums FOR SELECT USING (true);

CREATE POLICY "Page admins can insert albums"
ON public.media_albums FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.page_members
    WHERE page_id = media_albums.page_id
    AND user_id = auth.uid()
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Page admins can update albums"
ON public.media_albums FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.page_members
    WHERE page_id = media_albums.page_id
    AND user_id = auth.uid()
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Page admins can delete albums"
ON public.media_albums FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.page_members
    WHERE page_id = media_albums.page_id
    AND user_id = auth.uid()
    AND access_level = 'admin'
  )
);

-- 4. RLS for media_tracks for page admins
CREATE POLICY "Page admins can insert media tracks"
ON public.media_tracks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.page_members
    WHERE page_id = media_tracks.page_id
    AND user_id = auth.uid()
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Page admins can update media tracks"
ON public.media_tracks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.page_members
    WHERE page_id = media_tracks.page_id
    AND user_id = auth.uid()
    AND access_level IN ('admin', 'editor')
  )
);

CREATE POLICY "Page admins can delete media tracks"
ON public.media_tracks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.page_members
    WHERE page_id = media_tracks.page_id
    AND user_id = auth.uid()
    AND access_level = 'admin'
  )
);

-- 5. Drop the old artist_portfolio table since it is unified now
DROP TABLE IF EXISTS public.artist_portfolio;
