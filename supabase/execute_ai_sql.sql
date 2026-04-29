-- SECURE AI SQL EXECUTION HELPER
-- Allows the Admin to execute SQL proposed by the AI Architect
-- Restricted to superusers/admins via RLS and security definer checks

CREATE OR REPLACE FUNCTION execute_ai_sql(sql_query TEXT)
RETURNS void AS $$
BEGIN
    -- Check if the calling user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only platform administrators can execute AI proposed SQL.';
    END IF;

    -- Log the execution for security auditing
    INSERT INTO public.platform_activity (action_type, description, user_id)
    VALUES ('ai_sql_execution', 'Executed AI Architect SQL: ' || LEFT(sql_query, 100) || '...', auth.uid());

    -- Execute the query
    EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
