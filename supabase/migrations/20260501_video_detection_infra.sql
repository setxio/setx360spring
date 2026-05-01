-- Migration: Automatic Video Detection & Type Constraint Update
-- This migration updates the post type constraints and adds a trigger to automatically
-- categorize posts containing YouTube links as 'video'.

-- 1. Update the Post Type Constraint
-- First, we need to drop the old constraint and add the new one that includes 'video', 'testament', and 'bible_question'
DO $$
BEGIN
    -- Drop the old constraint if it exists (it's usually named posts_type_check or similar)
    -- We'll search for it by table and definition
    EXECUTE (
        SELECT 'ALTER TABLE public.posts DROP CONSTRAINT ' || quote_ident(constraint_name)
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'posts' AND column_name = 'type'
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint not found or already dropped';
END $$;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_type_check 
CHECK (type IN (
    'post', 'news', 'poll', 'event', 'prayer_request', 'bible_verse', 
    'announcement', 'sale', 'repost', 'video', 'testament', 'bible_question'
));

-- 2. Create the Video Detection Function
CREATE OR REPLACE FUNCTION public.handle_video_post_detection()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if content contains YouTube or common video patterns
    -- Pattern: youtube.com, youtu.be, vimeo.com, or direct link to video file
    IF (NEW.content ~* '(youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|ogg|mov))') THEN
        -- Only override if it's currently a standard 'post'
        -- We don't want to override 'news' or 'event' even if they have a video
        IF (NEW.type = 'post') THEN
            NEW.type := 'video';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS tr_detect_video_posts ON public.posts;
CREATE TRIGGER tr_detect_video_posts
BEFORE INSERT OR UPDATE OF content ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_post_detection();

-- 4. Backfill Existing Posts
-- Update any existing posts that should be categorized as 'video'
UPDATE public.posts 
SET type = 'video'
WHERE type = 'post' 
AND content ~* '(youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|ogg|mov))';

-- 6. AI Categorization RPC
-- This allows the AI Edge Function to update types safely
CREATE OR REPLACE FUNCTION public.categorize_post_ai(
    post_id_val UUID,
    new_type TEXT,
    metadata JSONB
)
RETURNS void AS $$
BEGIN
    UPDATE public.posts 
    SET 
        type = new_type,
        ai_metadata = metadata
    WHERE id = post_id_val 
    AND type = 'post'; -- Only upgrade generic posts
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
