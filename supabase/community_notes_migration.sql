-- Create Community Notes table
CREATE TABLE IF NOT EXISTS public.community_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'helpful', 'not_helpful')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Community Note Ratings table
CREATE TABLE IF NOT EXISTS public.community_note_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES public.community_notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating TEXT NOT NULL CHECK (rating IN ('helpful', 'not_helpful', 'somewhat_helpful')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(note_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_note_ratings ENABLE ROW LEVEL SECURITY;

-- Community Notes Policies
CREATE POLICY "Public read access for community notes"
    ON public.community_notes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can propose community notes"
    ON public.community_notes FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update/delete their own proposed notes"
    ON public.community_notes FOR ALL
    USING (auth.uid() = user_id AND status = 'proposed');

-- Community Note Ratings Policies
CREATE POLICY "Public read access for note ratings"
    ON public.community_note_ratings FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can rate notes"
    ON public.community_note_ratings FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update/delete their own ratings"
    ON public.community_note_ratings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
    ON public.community_note_ratings FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update status based on ratings
-- If 3+ helpful and helpful > not_helpful * 2, mark as helpful
-- If 5+ not helpful and not helpful > helpful, mark as not_helpful
CREATE OR REPLACE FUNCTION update_note_status()
RETURNS TRIGGER AS $$
DECLARE
    helpful_count INTEGER;
    not_helpful_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO helpful_count FROM community_note_ratings WHERE note_id = NEW.note_id AND rating = 'helpful';
    SELECT COUNT(*) INTO not_helpful_count FROM community_note_ratings WHERE note_id = NEW.note_id AND rating = 'not_helpful';

    IF helpful_count >= 3 AND helpful_count > not_helpful_count * 2 THEN
        UPDATE community_notes SET status = 'helpful' WHERE id = NEW.note_id;
    ELSIF not_helpful_count >= 5 AND not_helpful_count > helpful_count THEN
        UPDATE community_notes SET status = 'not_helpful' WHERE id = NEW.note_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_note_status ON public.community_note_ratings;
CREATE TRIGGER tr_update_note_status
AFTER INSERT OR UPDATE ON public.community_note_ratings
FOR EACH ROW EXECUTE FUNCTION update_note_status();
