-- Create published_apps table for SETX 360 Apps market

CREATE TABLE IF NOT EXISTS public.published_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    app_url TEXT,
    category TEXT CHECK (category IN ('pro', 'labs')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.published_apps ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Published apps are viewable by everyone"
    ON public.published_apps FOR SELECT
    USING (true);

CREATE POLICY "Developers can insert their own apps"
    ON public.published_apps FOR INSERT
    WITH CHECK (auth.uid() = developer_id);

CREATE POLICY "Developers can update their own apps"
    ON public.published_apps FOR UPDATE
    USING (auth.uid() = developer_id);
