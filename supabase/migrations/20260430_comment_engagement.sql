-- ENABLE COMMENT ENGAGEMENT
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS upvote_count INT DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS downvote_count INT DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS repost_count INT DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- CREATE COMMENT VOTES TABLE
CREATE TABLE IF NOT EXISTS public.comment_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote_type INT NOT NULL CHECK (vote_type IN (1, -1)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR COMMENT VOTES
DO $$ BEGIN
    CREATE POLICY "Anyone can view comment votes" ON public.comment_votes FOR SELECT USING (true);
    CREATE POLICY "Users can vote on comments" ON public.comment_votes FOR ALL USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RPC TO INCREMENT VIEWS
CREATE OR REPLACE FUNCTION increment_comment_views(comment_id_val UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.comments
    SET views = COALESCE(views, 0) + 1
    WHERE id = comment_id_val;
END;
$$ LANGUAGE plpgsql;
