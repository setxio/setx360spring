import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  summary TEXT,
  messages JSONB DEFAULT '[]'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_conversations' AND schemaname = 'public') THEN
    ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop policy if exists and recreate
DROP POLICY IF EXISTS "Users can manage own conversations" ON public.ai_conversations;
CREATE POLICY "Users can manage own conversations" ON public.ai_conversations FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
`;

async function run() {
  // Try to use a generic RPC if it exists, otherwise we might need to do it via a migration or a custom function
  const { data, error } = await supabase.rpc('execute_ai_sql', { sql_query: sql });
  if (error) {
    console.error('Error executing SQL:', error);
  } else {
    console.log('SQL executed successfully');
  }
}

run();
