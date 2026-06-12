-- Phase 5 Schema Updates for Classifieds (Forensics & Reporting)

-- 1. Add Soft Delete tracking to items and events
ALTER TABLE public.classified_items
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE public.classified_events
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Add Forensic Freeze flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS forensic_freeze BOOLEAN DEFAULT false;

-- 3. Create Reports Table
CREATE TABLE IF NOT EXISTS public.classified_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES public.profiles(id) NOT NULL,
  item_id UUID REFERENCES public.classified_items(id) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS on reports
ALTER TABLE public.classified_reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create reports
CREATE POLICY "Users can create reports" 
  ON public.classified_reports 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = reporter_id);

-- Admins can read reports (Placeholder for admin check, for now just basic restriction)
CREATE POLICY "Users can only read their own reports"
  ON public.classified_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);
