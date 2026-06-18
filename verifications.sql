-- Create the verifications table
CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_role TEXT NOT NULL,
    physical_address TEXT,
    document_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own verifications
CREATE POLICY "Users can insert their own verifications" ON public.verifications
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Allow users to view their own verifications
CREATE POLICY "Users can view their own verifications" ON public.verifications
    FOR SELECT USING (auth.uid() = profile_id);

-- Create identity_documents bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('identity_documents', 'identity_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for identity_documents
-- Allow authenticated users to upload files to identity_documents
CREATE POLICY "Users can upload their own identity documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'identity_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to read their own identity documents
CREATE POLICY "Users can read their own identity documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'identity_documents' AND auth.uid()::text = (storage.foldername(name))[1]);
