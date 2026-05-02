-- Create daily_manna table to store daily verses and devotions
CREATE TABLE IF NOT EXISTS public.daily_manna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    verse_text TEXT NOT NULL,
    verse_reference TEXT NOT NULL,
    reflection TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.daily_manna ENABLE ROW LEVEL SECURITY;

-- Anyone can read daily manna
CREATE POLICY "Anyone can view daily manna" 
    ON public.daily_manna 
    FOR SELECT 
    USING (true);

-- Only service role (edge functions) can insert/update daily manna
CREATE POLICY "Service role can insert daily manna" 
    ON public.daily_manna 
    FOR ALL 
    USING (auth.role() = 'service_role');

-- Insert a placeholder verse for today so the UI has something to show immediately
INSERT INTO public.daily_manna (date, verse_text, verse_reference, reflection)
VALUES (
    CURRENT_DATE,
    '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."',
    'Jeremiah 29:11',
    'In seasons of uncertainty, whether from storms or personal trials, remember that God''s ultimate design for Southeast Texas and for you is one of hope and restoration.'
) ON CONFLICT (date) DO NOTHING;
