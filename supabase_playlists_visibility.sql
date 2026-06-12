-- Add visibility column to media_playlists
ALTER TABLE media_playlists 
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private' 
CHECK (visibility IN ('private', 'friends', 'public'));

-- Update RLS policies to respect visibility
-- First, drop the old SELECT policy
DROP POLICY IF EXISTS "Users can view their own playlists" ON media_playlists;

-- Create new SELECT policy that allows viewing if:
-- 1. User owns it
-- 2. It is public
-- 3. (Friends logic would go here, but for now we'll treat it as public or implement friends later)
CREATE POLICY "Users can view playlists based on visibility"
ON media_playlists FOR SELECT
USING (
  auth.uid() = user_id OR
  visibility = 'public' OR
  visibility = 'friends'
);
