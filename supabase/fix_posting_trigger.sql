-- 1. Ensure extension exists
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Update the trigger function with a safety wrapper and correct types
CREATE OR REPLACE FUNCTION public.trigger_classify_post()
RETURNS TRIGGER AS $$
DECLARE
  fn_url TEXT;
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdWxjcGJyaWtjdW1pb21yenVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTYxMTAsImV4cCI6MjA5MjE5MjExMH0.-GLZX6m5DrrAI6QZTi3b4JYI9pCPVCzm-P4Odlv15yQ';
BEGIN
  -- Skip for reposts or very short content (hi, hello, etc.)
  IF NEW.type = 'repost' OR LENGTH(COALESCE(NEW.content, '')) < 10 THEN
    RETURN NEW;
  END IF;

  fn_url := 'https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/classify-post';

  -- Wrap in BEGIN...EXCEPTION to ensure a failed AI call doesn't block the user's post
  BEGIN
    PERFORM net.http_post(
      url := fn_url,
      body := json_build_object('postId', NEW.id, 'content', NEW.content)::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      timeout_ms := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    -- If pg_net is missing or URL is unreachable, we log a warning but let the post succeed
    RAISE WARNING 'AI classification trigger failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-enable trigger
DROP TRIGGER IF EXISTS tr_classify_post ON public.posts;
CREATE TRIGGER tr_classify_post
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.trigger_classify_post();
