-- Fix RLS Policies for media_playlists
DROP POLICY IF EXISTS "Users can insert their own playlists" ON media_playlists;
CREATE POLICY "Users can insert their own playlists"
ON media_playlists FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own playlists" ON media_playlists;
CREATE POLICY "Users can update their own playlists"
ON media_playlists FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own playlists" ON media_playlists;
CREATE POLICY "Users can delete their own playlists"
ON media_playlists FOR DELETE
USING (auth.uid() = user_id);

-- Fix RLS Policies for media_playlist_tracks
DROP POLICY IF EXISTS "Users can view playlist tracks for visible playlists" ON media_playlist_tracks;
CREATE POLICY "Users can view playlist tracks for visible playlists"
ON media_playlist_tracks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM media_playlists 
    WHERE id = media_playlist_tracks.playlist_id 
    AND (user_id = auth.uid() OR visibility = 'public' OR visibility = 'friends')
  )
);

DROP POLICY IF EXISTS "Users can insert tracks to their own playlists" ON media_playlist_tracks;
CREATE POLICY "Users can insert tracks to their own playlists"
ON media_playlist_tracks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM media_playlists 
    WHERE id = media_playlist_tracks.playlist_id 
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete tracks from their own playlists" ON media_playlist_tracks;
CREATE POLICY "Users can delete tracks from their own playlists"
ON media_playlist_tracks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM media_playlists 
    WHERE id = media_playlist_tracks.playlist_id 
    AND user_id = auth.uid()
  )
);
