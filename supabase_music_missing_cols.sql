ALTER TABLE public.media_tracks ADD COLUMN IF NOT EXISTS album_type TEXT DEFAULT 'Single';
ALTER TABLE public.media_tracks ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE public.media_tracks ADD COLUMN IF NOT EXISTS moods TEXT[];
ALTER TABLE public.media_tracks ADD COLUMN IF NOT EXISTS energy_level INT;
ALTER TABLE public.media_tracks ADD COLUMN IF NOT EXISTS is_explicit BOOLEAN DEFAULT false;
