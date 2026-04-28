-- ═══════════════════════════════════════════════════════════════════
-- GLOBAL POSTING REPAIR: Fix all net.http_post triggers
-- Date: 2026-04-22
-- ═══════════════════════════════════════════════════════════════════

-- 1. Ensure extension exists
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Repair trigger_moderate_post
CREATE OR REPLACE FUNCTION public.trigger_moderate_post()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  fn_url TEXT := 'https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/moderate-post';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdWxjcGJyaWtjdW1pb21yenVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTYxMTAsImV4cCI6MjA5MjE5MjExMH0.-GLZX6m5DrrAI6QZTi3b4JYI9pCPVCzm-P4Odlv15yQ';
BEGIN
  IF NEW.type = 'repost' OR LENGTH(COALESCE(NEW.content, '')) < 8 THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := fn_url,
      body := json_build_object('postId', NEW.id, 'content', NEW.content, 'profileId', NEW.profile_id)::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      timeout_ms := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Moderation trigger failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- 3. Repair trigger_follow_suggestions
CREATE OR REPLACE FUNCTION public.trigger_follow_suggestions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  fn_url TEXT := 'https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/follow-suggestions';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdWxjcGJyaWtjdW1pb21yenVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTYxMTAsImV4cCI6MjA5MjE5MjExMH0.-GLZX6m5DrrAI6QZTi3b4JYI9pCPVCzm-P4Odlv15yQ';
BEGIN
  -- Only trigger for first post to suggest follows
  IF (SELECT COUNT(*) FROM public.posts WHERE profile_id = NEW.profile_id) > 1 THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := fn_url,
      body := json_build_object('userId', NEW.profile_id, 'postId', NEW.id)::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      timeout_ms := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Follow suggestions trigger failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- 4. Re-verify trigger_classify_post (just in case)
CREATE OR REPLACE FUNCTION public.trigger_classify_post()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

NOTIFY pgrst, 'reload schema';
