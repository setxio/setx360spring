-- SETX 360 AI INFRASTRUCTURE MIGRATION
-- Enables "Guardian" and "Community Pulse" features

-- 1. SYSTEM ERRORS TABLE (The "Pulse")
CREATE TABLE IF NOT EXISTS public.system_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_type TEXT NOT NULL, -- 'database', 'frontend', 'logic'
    message TEXT NOT NULL,
    stack_trace TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store user_id, env, scope at time of error
    is_healed BOOLEAN DEFAULT FALSE,
    repair_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AI MAINTENANCE LOGS (The "Guardian" History)
CREATE TABLE IF NOT EXISTS public.ai_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type TEXT NOT NULL, -- 'cleanup', 'optimization', 'healing'
    description TEXT,
    impact_count INT DEFAULT 0, -- Number of records fixed/updated
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI REPAIR REPORTS (The "Architect" Drafts)
CREATE TABLE IF NOT EXISTS public.ai_repair_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    issue_description TEXT,
    proposed_fix_sql TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'applied', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS POLICIES (Admin Only)
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_repair_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Admins can manage system logs" ON public.system_errors FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
    CREATE POLICY "Admins can manage maintenance logs" ON public.ai_maintenance_logs FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
    CREATE POLICY "Admins can manage repair reports" ON public.ai_repair_reports FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. AUTOMATIC ERROR TRIGGER (Optional/Conceptual)
-- This function would be called from the frontend or edge functions to log critical failures
CREATE OR REPLACE FUNCTION log_system_error(msg TEXT, err_type TEXT, meta JSONB)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO public.system_errors (message, error_type, metadata)
    VALUES (msg, err_type, meta)
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
