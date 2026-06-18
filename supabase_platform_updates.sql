-- 1. Create bug_reports table
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own bug reports" 
ON public.bug_reports FOR INSERT 
WITH CHECK (auth.uid() = profile_id OR auth.uid() IS NULL);

CREATE POLICY "Admins can view all bug reports" 
ON public.bug_reports FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins can update bug reports" 
ON public.bug_reports FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 2. Create bug_screenshots bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bug_screenshots', 'bug_screenshots', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own bug screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bug_screenshots');

CREATE POLICY "Admins can view bug screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'bug_screenshots' 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins can delete bug screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bug_screenshots' 
  AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 3. Create admin_broadcasts table
CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info' or 'alert'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active admin broadcasts"
ON public.admin_broadcasts FOR SELECT
USING (active = true);

CREATE POLICY "Admins can insert broadcasts"
ON public.admin_broadcasts FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins can update broadcasts"
ON public.admin_broadcasts FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 4. Create user_broadcast_reads table for tracking archived messages
CREATE TABLE IF NOT EXISTS public.user_broadcast_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  broadcast_id UUID REFERENCES public.admin_broadcasts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, broadcast_id)
);

ALTER TABLE public.user_broadcast_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own broadcast reads"
ON public.user_broadcast_reads
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Add album_name to media_tracks
ALTER TABLE public.media_tracks ADD COLUMN IF NOT EXISTS album_name TEXT;

-- 6. Add album_type to media_tracks
ALTER TABLE public.media_tracks ADD COLUMN IF NOT EXISTS album_type TEXT DEFAULT 'Single';

-- 7. Add genre to media_tracks
ALTER TABLE public.media_tracks ADD COLUMN IF NOT EXISTS genre TEXT;

-- 8. Add moods and energy_level to media_tracks
ALTER TABLE public.media_tracks ADD COLUMN IF NOT EXISTS moods TEXT[];
ALTER TABLE public.media_tracks ADD COLUMN IF NOT EXISTS energy_level INT;
