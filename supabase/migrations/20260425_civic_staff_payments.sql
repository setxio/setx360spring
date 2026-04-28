-- SETX 360: Civic Staff & Payments Migration

-- 1. Extend Roles to include City Staff
DO $$ 
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN (
            'admin', 'resident', 'business', 'chamber', 'official', 
            'artist', 'venue', 'media', 'non_profit', 'church', 'guest',
            'city_worker', 'city_manager',
            -- Verified variants
            'v_business', 'v_official', 'v_chamber', 'v_media', 'v_artist', 'v_venue', 'v_non_profit', 'v_church'
        ));
END $$;

-- 2. Formal Civic Incidents Table (Upgraded 311)
CREATE TABLE IF NOT EXISTS public.civic_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('pothole', 'streetlight', 'graffiti', 'code_violation', 'utility_issue', 'other')),
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    media_urls TEXT[],
    upvote_count INT DEFAULT 0,
    community TEXT,
    county TEXT,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for geo-filtering
CREATE INDEX IF NOT EXISTS idx_incidents_geo ON public.civic_incidents(community, county, state);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned ON public.civic_incidents(assigned_to);

-- 3. SETX Payments Ledger
CREATE TABLE IF NOT EXISTS public.setx_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    type TEXT NOT NULL CHECK (type IN ('utility_payment', 'ad_credit_purchase', 'marketplace_order', 'withdrawal', 'transfer')),
    method TEXT DEFAULT 'internal_credit' CHECK (method IN ('internal_credit', 'stripe', 'card')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    reference_id TEXT, -- Order ID, Utility Account, etc.
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS Policies
ALTER TABLE public.civic_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setx_transactions ENABLE ROW LEVEL SECURITY;

-- Incidents: Everyone can see, only residents can create
CREATE POLICY "Public Incidents Access" ON public.civic_incidents FOR SELECT USING (true);
CREATE POLICY "Residents can report" ON public.civic_incidents FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Staff can update" ON public.civic_incidents FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'official', 'city_worker', 'city_manager')
    )
);

-- Transactions: Private to user and admins/staff
CREATE POLICY "Users can see own transactions" ON public.setx_transactions FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'city_manager'))
);
CREATE POLICY "Users can initiate transactions" ON public.setx_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Trigger for Priority based on Upvotes (Mock or simple logic)
-- In a real app, this would be handled by a function that recalculates on each upvote.
