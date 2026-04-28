DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);
<!-- slide -->
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
<!-- slide -->
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(user_id_val UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.notifications SET is_read = TRUE 
    WHERE recipient_id = user_id_val AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
