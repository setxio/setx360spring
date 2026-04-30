-- Add missing columns to comments table to support threaded replies and engagement
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS upvote_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvote_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;

-- Refresh the PostgREST schema cache so the API recognizes the new columns immediately
NOTIFY pgrst, 'reload schema';
