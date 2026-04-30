-- Explicitly add RLS policy for deleting comments if it's missing
CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = profile_id);
