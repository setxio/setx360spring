-- Run this snippet in your Supabase SQL Editor
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS translation_language TEXT DEFAULT 'en';
