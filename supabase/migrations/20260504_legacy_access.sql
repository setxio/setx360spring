-- LEGACY ACCESS / GUARDIAN INFRASTRUCTURE
-- Allows users to nominate a trusted person to gain access to their account in case of death/emergency.

-- 1. Configuration for who is a trusted person
CREATE TABLE IF NOT EXISTS public.legacy_access_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    trusted_person_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- Only one trusted person per account for simplicity
);

-- 2. Requests for access
CREATE TABLE IF NOT EXISTS public.legacy_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- The account to be accessed
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- The person requesting access
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    access_pin TEXT, -- The PIN generated for the requester to use as a temporary password
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 3. Add Blur NSFW setting to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blur_nsfw BOOLEAN DEFAULT true;

-- Enable RLS
ALTER TABLE public.legacy_access_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_access_requests ENABLE ROW LEVEL SECURITY;

-- Policies for Config
CREATE POLICY "Users can view their own legacy config" ON public.legacy_access_config
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = trusted_person_id);

CREATE POLICY "Users can manage their own legacy config" ON public.legacy_access_config
    FOR ALL USING (auth.uid() = user_id);

-- Policies for Requests
CREATE POLICY "Users can view requests they are involved in" ON public.legacy_access_requests
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = requester_id);

CREATE POLICY "Trusted persons can create access requests" ON public.legacy_access_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.legacy_access_config 
            WHERE user_id = legacy_access_requests.user_id 
              AND trusted_person_id = auth.uid()
        )
    );

-- Admin Policy
CREATE POLICY "Admins can view and update all requests" ON public.legacy_access_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
