-- ========================================================
-- SETX360: ADVANCED SOCIAL ENGAGEMENT MIGRATION
-- Formula: Hot Score = (Votes + Reposts*25 + Replies*13) / (Age+2)^1.5
-- ========================================================

-- 1. UPGRADE POSTS TABLE
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS upvote_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvote_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS repost_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS views INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS hot_score FLOAT DEFAULT 0;

-- 2. CREATE VOTES TABLE
CREATE TABLE IF NOT EXISTS public.post_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type INT CHECK (vote_type IN (-1, 1)), -- 1 = Upvote, -1 = Downvote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

-- Post Votes RLS
CREATE POLICY "Votes are viewable by everyone" ON public.post_votes FOR SELECT USING (true);
CREATE POLICY "Users can manage own votes" ON public.post_votes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. HOT SCORE CALCULATION FUNCTION
CREATE OR REPLACE FUNCTION calculate_hot_score()
RETURNS TRIGGER AS $$
DECLARE
    age_hours FLOAT;
    upvotes INT;
    downvotes INT;
BEGIN
    upvotes := COALESCE(NEW.upvote_count, 0);
    downvotes := COALESCE(NEW.downvote_count, 0);
    
    -- Calculate age in hours (minimum 0.1h to avoid division issues)
    age_hours := GREATEST(EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 3600, 0.1);

    -- Formula derived from SETXIO3 logic
    -- Weights: Repost (25), Reply (13), Vote (1)
    -- Decay Gravity: 1.5
    NEW.hot_score := ((NEW.repost_count * 25) + (NEW.comments_count * 13) + (upvotes - downvotes)) / POWER((age_hours + 2), 1.5);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. VOTE COUNT TRIGGER
CREATE OR REPLACE FUNCTION update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.vote_type = 1) THEN
            UPDATE public.posts SET upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE public.posts SET downvote_count = downvote_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.vote_type = 1) THEN
            UPDATE public.posts SET upvote_count = upvote_count - 1 WHERE id = OLD.post_id;
        ELSE
            UPDATE public.posts SET downvote_count = downvote_count - 1 WHERE id = OLD.post_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.vote_type != NEW.vote_type) THEN
            IF (NEW.vote_type = 1) THEN
                UPDATE public.posts SET upvote_count = upvote_count + 1, downvote_count = downvote_count - 1 WHERE id = NEW.post_id;
            ELSE
                UPDATE public.posts SET downvote_count = downvote_count + 1, upvote_count = upvote_count - 1 WHERE id = NEW.post_id;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ATTACH TRIGGERS
DROP TRIGGER IF EXISTS tr_calculate_hot_score ON public.posts;
CREATE TRIGGER tr_calculate_hot_score
BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION calculate_hot_score();

DROP TRIGGER IF EXISTS tr_update_post_vote_counts ON public.post_votes;
CREATE TRIGGER tr_update_post_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON public.post_votes
FOR EACH ROW EXECUTE FUNCTION update_post_vote_counts();

-- 6. MIGRATE OLD LIKES TO UPVOTES
INSERT INTO public.post_votes (post_id, user_id, vote_type)
SELECT post_id, profile_id, 1 FROM public.likes
ON CONFLICT (post_id, user_id) DO NOTHING;

-- UPDATE upvote_count for existing likes
UPDATE public.posts p
SET upvote_count = (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 1),
    downvote_count = (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = -1);

-- FORCE INITIAL HOT SCORE CALCULATION
UPDATE public.posts SET hot_score = 0; -- Trigger will recalculate real value
