-- ========================================================
-- SETX360: OFFICIAL ALERTS & STAN INTEGRATION SETUP
-- 1. Alerts Archive Table (stan_alerts)
-- 2. Security & RLS
-- 3. Automated Polling (requires pg_cron)
-- ========================================================

-- 1. ALERTS ARCHIVE TABLE
-- This table mirrors the Social Feed posts but keeps raw data for history
CREATE TABLE IF NOT EXISTS public.stan_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guid TEXT UNIQUE NOT NULL, -- NWS alert ID or RSS link
  title TEXT NOT NULL,
  content TEXT,
  alert_type TEXT,
  severity TEXT CHECK (severity IN ('critical', 'warning', 'info', 'test', 'unknown')),
  alert_scope TEXT CHECK (alert_scope IN ('city', 'county', 'state', 'national')),
  affected_counties TEXT[] DEFAULT '{}',
  source TEXT, -- 'NWS', 'EAN', NULL (defaults to STAN in UI)
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for history lookup
CREATE INDEX IF NOT EXISTS idx_stan_alerts_posted_at ON public.stan_alerts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_stan_alerts_source ON public.stan_alerts(source);

-- 2. SECURITY & RLS
ALTER TABLE public.stan_alerts ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view the alert archive
CREATE POLICY "Users can view alert archive" ON public.stan_alerts 
  FOR SELECT USING (true);

-- Only admins can manage the archive
CREATE POLICY "Admins can manage archive" ON public.stan_alerts 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. AUTOMATED POLLING (CRON SETUP)
-- Note: These require the 'pg_cron' and 'pg_net' extensions enabled in Supabase
-- Replace YOUR_ANON_KEY and PROJECT_REF with actual values

-- Schedule STAN Polling (Every 5 minutes)
SELECT cron.schedule(
  'poll_stan_alerts',
  '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/poll-stan',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdWxjcGJyaWtjdW1pb21yenVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTYxMTAsImV4cCI6MjA5MjE5MjExMH0.-GLZX6m5DrrAI6QZTi3b4JYI9pCPVCzm-P4Odlv15yQ"}'::jsonb
  );
  $$
);

/*
-- Schedule NWS Polling (Every 10 minutes)
-- If shorthand fails, use: '0,10,20,30,40,50 * * * *'
SELECT cron.schedule(
  'poll_nws_alerts',
  '0,10,20,30,40,50 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/poll-nws',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdWxjcGJyaWtjdW1pb21yenVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTYxMTAsImV4cCI6MjA5MjE5MjExMH0.-GLZX6m5DrrAI6QZTi3b4JYI9pCPVCzm-P4Odlv15yQ"}'::jsonb
  );
  $$
);
*/

-- 4. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
