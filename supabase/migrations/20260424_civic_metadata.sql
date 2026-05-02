-- Enable uuid-ossp for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Add metadata column to posts for civic tracking
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Ensure schema cache is reloaded
NOTIFY pgrst, 'reload schema';
