-- Add track_number to media_tracks
ALTER TABLE public.media_tracks ADD COLUMN IF NOT EXISTS track_number INTEGER;
