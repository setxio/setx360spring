-- 1. Create secure identity_documents storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('identity_documents', 'identity_documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage: Users can upload to their own folder, but only admins can view
CREATE POLICY "Users can upload their own identity documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'identity_documents' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "Admins can view identity documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'identity_documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete identity documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'identity_documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 2. Add verification fields to verifications table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verifications' AND column_name='document_url') THEN
    ALTER TABLE public.verifications ADD COLUMN document_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verifications' AND column_name='physical_address') THEN
    ALTER TABLE public.verifications ADD COLUMN physical_address TEXT;
  END IF;
END $$;

-- 3. Add dispute tracking fields to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='identity_disputed') THEN
    ALTER TABLE public.profiles ADD COLUMN identity_disputed BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='dispute_reason') THEN
    ALTER TABLE public.profiles ADD COLUMN dispute_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='read_only') THEN
    ALTER TABLE public.profiles ADD COLUMN read_only BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='dispute_date') THEN
    ALTER TABLE public.profiles ADD COLUMN dispute_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 4. Automatically set users to suspended if read_only and dispute_date > 30 days ago
-- We can enforce this dynamically in the UI and via RLS or cron, but setting the foundation here.
