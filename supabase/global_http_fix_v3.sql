-- ═══════════════════════════════════════════════════════════════════
-- GLOBAL POSTING REPAIR (V3): Positional arguments for pg_net 0.2
-- This ensures the highest compatibility with older Supabase extensions.
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
  req_body JSONB;
  req_headers JSONB;
BEGIN
  -- Basic sanity check
  IF NEW.type = 'repost' OR LENGTH(COALESCE(NEW.content, '')) < 8 THEN
    RETURN NEW;
  END IF;

  req_body := jsonb_build_object(
    'postId', NEW.id, 
    'content', NEW.content, 
    'profileId', NEW.profile_id
  );
  
  req_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || anon_key
  );

  -- POSITIONAL CALL: net.http_post(url, body, params, headers, timeout_ms)
  BEGIN
    PERFORM net.http_post(
      fn_url,
      req_body,
      '{}'::jsonb,
      req_headers,
      5000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'AI Moderation failed but post allowed: %', SQLERRM;
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
  req_body JSONB;
  req_headers JSONB;
BEGIN
  -- Only trigger for first post
  IF (SELECT COUNT(*) FROM public.posts WHERE profile_id = NEW.profile_id) > 1 THEN
    RETURN NEW;
  END IF;

  req_body := jsonb_build_object('userId', NEW.profile_id, 'postId', NEW.id);
  req_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || anon_key
  );

  BEGIN
    PERFORM net.http_post(
      fn_url,
      req_body,
      '{}'::jsonb,
      req_headers,
      5000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'AI Follow Suggestions failed but post allowed: %', SQLERRM;
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
  fn_url TEXT := 'https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/classify-post';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdWxjcGJyaWtjdW1pb21yenVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTYxMTAsImV4cCI6MjA5MjE5MjExMH0.-GLZX6m5DrrAI6QZTi3b4JYI9pCPVCzm-P4Odlv15yQ';
  req_body JSONB;
  req_headers JSONB;
BEGIN
  IF NEW.type = 'repost' OR LENGTH(COALESCE(NEW.content, '')) < 10 THEN
    RETURN NEW;
  END IF;

  req_body := jsonb_build_object('postId', NEW.id, 'content', NEW.content);
  req_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || anon_key
  );

  BEGIN
    PERFORM net.http_post(
      fn_url,
      req_body,
      '{}'::jsonb,
      req_headers,
      5000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'AI Classification failed but post allowed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- 4. Re-enable Triggers
DROP TRIGGER IF EXISTS tr_classify_post ON public.posts;
CREATE TRIGGER tr_classify_post
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_classify_post();

DROP TRIGGER IF EXISTS tr_moderate_post ON public.posts;
CREATE TRIGGER tr_moderate_post
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_moderate_post();

DROP TRIGGER IF EXISTS tr_follow_suggestions ON public.posts;
CREATE TRIGGER tr_follow_suggestions
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_follow_suggestions();

NOTIFY pgrst, 'reload schema';
