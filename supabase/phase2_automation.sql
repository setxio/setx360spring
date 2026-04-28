-- ═══════════════════════════════════════════════════════════════════
-- PHASE 2: AI CLASSIFICATION LAYER
-- Deployed: 2026-04-21
-- Components: ai_category, hot_score decay, pg_net trigger,
--             classify-post Edge Function (Gemini Flash + heuristic fallback)
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 2.1: SCHEMA — AI classification columns
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS ai_category TEXT DEFAULT 'social';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS ai_extracted_keyword TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS ai_classified_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_posts_ai_category ON public.posts(ai_category);

-- ───────────────────────────────────────────────────────────────────
-- 2.2: HOT-SCORE DECAY (cron: every hour at :30)
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.decay_hot_scores()
RETURNS void AS $$
BEGIN
  UPDATE public.posts SET hot_score =
    ((repost_count * 25) + (comments_count * 13) + (upvote_count - downvote_count))
    / POWER((GREATEST(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600, 0.1) + 2), 1.5)
  WHERE created_at > NOW() - INTERVAL '7 days';

  UPDATE public.posts SET hot_score = 0
  WHERE created_at <= NOW() - INTERVAL '7 days' AND hot_score > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: SELECT cron.schedule('decay_hot_scores', '30 * * * *', 'SELECT public.decay_hot_scores()');

-- ───────────────────────────────────────────────────────────────────
-- 2.3: pg_net EXTENSION (needed for trigger → Edge Function HTTP calls)
-- ───────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ───────────────────────────────────────────────────────────────────
-- 2.4: CLASSIFY TRIGGER (fires Edge Function after post INSERT)
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_classify_post()
RETURNS TRIGGER AS $$
DECLARE
  fn_url TEXT;
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdWxjcGJyaWtjdW1pb21yenVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTYxMTAsImV4cCI6MjA5MjE5MjExMH0.-GLZX6m5DrrAI6QZTi3b4JYI9pCPVCzm-P4Odlv15yQ';
BEGIN
  IF NEW.type = 'repost' OR LENGTH(COALESCE(NEW.content, '')) < 10 THEN
    RETURN NEW;
  END IF;
  fn_url := 'https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/classify-post';
  PERFORM net.http_post(
    url := fn_url,
    body := json_build_object('postId', NEW.id, 'content', NEW.content)::text,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_classify_post ON public.posts;
CREATE TRIGGER tr_classify_post
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.trigger_classify_post();

-- ───────────────────────────────────────────────────────────────────
-- 2.5: BACKFILL — Heuristic classify all existing posts
-- ───────────────────────────────────────────────────────────────────
UPDATE public.posts SET ai_category = CASE
  WHEN LOWER(content) ~ '(pray|prayer|lord|god|bless|church|bible|faith|amen)' THEN 'prayer_request'
  WHEN LOWER(content) ~ '(looking for|need a|need an|where to buy|where can i find|recommend a|who sells|hiring a|want to hire)' THEN 'buying_intent'
  WHEN LOWER(content) ~ '(for sale|selling|dm me|available now|priced at|must go)' THEN 'selling'
  WHEN LOWER(content) ~ '(hiring|job opening|position available|apply now)' THEN 'job_posting'
  WHEN LOWER(content) ~ '(event|join us|rsvp|this weekend|come out|live music|tonight)' THEN 'event_sharing'
  WHEN LOWER(content) ~ '(breaking|update|announcement|alert|road closed|notice|reminder)' THEN 'community_news'
  WHEN content LIKE '%?%' OR LOWER(content) ~ '(anyone know|what is|has anyone|can someone|how do i)' THEN 'question'
  ELSE 'social'
END,
ai_classified_at = NOW()
WHERE length(COALESCE(content,'')) > 0;

-- ───────────────────────────────────────────────────────────────────
-- FINALIZE
-- ───────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ───────────────────────────────────────────────────────────────────
-- OPTIONAL: Add Gemini API key as Edge Function secret
-- Run in Supabase CLI:
-- supabase secrets set GEMINI_API_KEY=your_key_here --project-ref okulcpbrikcumiomrzuh
-- Get free key at: https://aistudio.google.com
-- ───────────────────────────────────────────────────────────────────
