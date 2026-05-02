-- Trigger Function for Bot Engagement
CREATE OR REPLACE FUNCTION public.invoke_bot_engager()
RETURNS TRIGGER AS $$
BEGIN
  -- We trigger for all posts, the edge function will handle the 40% logic and bot-check
  PERFORM net.http_post(
    url := 'https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/bot-engager',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SUPABASE_SECRET'
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW)::jsonb
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger on public.posts
DROP TRIGGER IF EXISTS on_post_created_engagement ON public.posts;
CREATE TRIGGER on_post_created_engagement
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.invoke_bot_engager();
