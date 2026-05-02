-- Create AI Conversations table for historical tracking
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  summary TEXT,
  messages JSONB DEFAULT '[]'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own conversations" 
  ON public.ai_conversations 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = profile_id) 
  WITH CHECK (auth.uid() = profile_id);

-- Index for performance
CREATE INDEX idx_ai_conversations_profile_id ON public.ai_conversations(profile_id);
