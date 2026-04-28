$dbUrl = "postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
$queries = @(
    "DROP POLICY IF EXISTS `"Users can view own notifications`" ON public.notifications",
    "CREATE POLICY `"Users can view own notifications`" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id)",
    "DROP POLICY IF EXISTS `"Users can update own notifications`" ON public.notifications",
    "CREATE POLICY `"Users can update own notifications`" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id)",
    "DROP POLICY IF EXISTS `"System can insert notifications`" ON public.notifications",
    "CREATE POLICY `"System can insert notifications`" ON public.notifications FOR INSERT WITH CHECK (true)",
    "CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(user_id_val UUID) RETURNS void AS ' BEGIN UPDATE public.notifications SET is_read = TRUE WHERE recipient_id = user_id_val AND is_read = FALSE; END; ' LANGUAGE plpgsql SECURITY DEFINER",
    "NOTIFY pgrst, 'reload schema'"
)

foreach ($q in $queries) {
    Write-Host "Executing: $q"
    npx supabase db query --db-url $dbUrl $q --agent no
}
