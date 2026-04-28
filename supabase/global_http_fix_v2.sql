-- ═══════════════════════════════════════════════════════════════════
-- GLOBAL POSTING REPAIR (V2): Fix signature for pg_net 0.2
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Repair trigger_moderate_post
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
      body := jsonb_build_object('postId', NEW.id, 'content', NEW.content, 'profileId', NEW.profile_id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Moderation trigger failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- 2. Repair trigger_follow_suggestions
CREATE OR REPLACE FUNCTION public.trigger_follow_suggestions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  fn_url TEXT := 'https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/follow-suggestions';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdWxjcGJyaWtjdW1pb21yenVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTYxMTAsImV4cCI6MjA5MjE5MjExMH0.-GLZX6m5DrrAI6QZTi3b4JYI9pCPVCzm-P4Odlv15yQ';
BEGIN
  IF (SELECT COUNT(*) FROM public.posts WHERE profile_id = NEW.profile_id) > 1 THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := fn_url,
      body := jsonb_build_object('userId', NEW.profile_id, 'postId', NEW.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Follow suggestions trigger failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- 3. Repair trigger_classify_post
CREATE OR REPLACE FUNCTION public.trigger_classify_post()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  fn_url TEXT;
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdWxjcGJyaWtjdW1pb21yenVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTYxMTAsImV4cCI6MjA5MjE5MjExMH0.-GLZX6m5DrrAI6QZTi3b4JYI9pCPVCzm-P4Odlv15yQ';
BEGIN
  IF NEW.type = 'repost' OR LENGTH(COALESCE(NEW.content, '')) < 10 THEN
    RETURN NEW;
  END IF;

  fn_url := 'https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/classify-post';

  BEGIN
    PERFORM net.http_post(
      url := fn_url,
      body := jsonb_build_object('postId', NEW.id, 'content', NEW.content),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'AI classification trigger failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

NOTIFY pgrst, 'reload schema';
