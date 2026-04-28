-- 1. Engagement System: Votes & Hot Score
-- Rename likes to post_votes and add vote_type
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'likes') THEN
        ALTER TABLE likes RENAME TO post_votes;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'post_votes' AND column_name = 'vote_type') THEN
        ALTER TABLE post_votes ADD COLUMN vote_type INT NOT NULL DEFAULT 1 CHECK (vote_type IN (1, -1));
    END IF;

    -- Add engagement columns to posts if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'upvote_count') THEN
        ALTER TABLE posts ADD COLUMN upvote_count INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'downvote_count') THEN
        ALTER TABLE posts ADD COLUMN downvote_count INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'repost_count') THEN
        ALTER TABLE posts ADD COLUMN repost_count INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'reply_count') THEN
        ALTER TABLE posts ADD COLUMN reply_count INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'hot_score') THEN
        ALTER TABLE posts ADD COLUMN hot_score FLOAT DEFAULT 0.0;
    END IF;
END $$;

-- 2. Hot Score Calculation Function
CREATE OR REPLACE FUNCTION calculate_hot_score()
RETURNS TRIGGER AS $$
DECLARE
    age_hours FLOAT;
    upvotes INT;
    downvotes INT;
BEGIN
    upvotes := COALESCE(NEW.upvote_count, 0);
    downvotes := COALESCE(NEW.downvote_count, 0);
    
    -- Calculate age of post in hours
    age_hours := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 3600;

    -- Update the hot_score using weighted engagement and time decay
    -- Weights: Repost (25), Reply (13), Upvote (1), Downvote (-1)
    -- Time decay: older posts lose score with gravity of 1.5
    NEW.hot_score := ((NEW.repost_count * 25) + (NEW.reply_count * 13) + (upvotes - downvotes)) / POWER((age_hours + 2), 1.5);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Triggers for hot_score
DROP TRIGGER IF EXISTS update_post_score ON posts;
CREATE TRIGGER update_post_score
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION calculate_hot_score();

DROP TRIGGER IF EXISTS insert_post_score ON posts;
CREATE TRIGGER insert_post_score
BEFORE INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION calculate_hot_score();

-- 4. Vote Sync Logic
CREATE OR REPLACE FUNCTION update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.vote_type = 1) THEN
            UPDATE posts SET upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE posts SET downvote_count = downvote_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.vote_type = 1) THEN
            UPDATE posts SET upvote_count = upvote_count - 1 WHERE id = OLD.post_id;
        ELSE
            UPDATE posts SET downvote_count = downvote_count - 1 WHERE id = OLD.post_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.vote_type != NEW.vote_type) THEN
            IF (NEW.vote_type = 1) THEN
                UPDATE posts SET upvote_count = upvote_count + 1, downvote_count = downvote_count - 1 WHERE id = NEW.post_id;
            ELSE
                UPDATE posts SET downvote_count = downvote_count + 1, upvote_count = upvote_count - 1 WHERE id = NEW.post_id;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_votes_trigger ON post_votes;
CREATE TRIGGER post_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON post_votes
FOR EACH ROW
EXECUTE FUNCTION update_post_vote_counts();

-- 5. Social Infrastructure: Events, Groups, Polls
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    image_url TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('interested', 'going', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, post_id)
);

-- 6. RLS Policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public events" ON public.events;
CREATE POLICY "Anyone can view public events" ON public.events FOR SELECT USING (is_public = true OR profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can create events" ON public.events;
CREATE POLICY "Users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can manage own events" ON public.events;
CREATE POLICY "Users can manage own events" ON public.events FOR ALL USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can bookmark posts" ON public.bookmarks;
CREATE POLICY "Users can bookmark posts" ON public.bookmarks FOR ALL USING (auth.uid() = profile_id);
