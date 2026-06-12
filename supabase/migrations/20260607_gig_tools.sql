-- Gig Worker Profiles
CREATE TABLE public.gig_worker_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    background_check_status TEXT NOT NULL DEFAULT 'Pending' CHECK (background_check_status IN ('Pending', 'Approved', 'Rejected')),
    primary_category TEXT,
    success_rate NUMERIC DEFAULT 100.0,
    total_gigs_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Gig Time Logs
CREATE TABLE public.gig_time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.gig_worker_profiles(id) ON DELETE CASCADE,
    punch_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    punch_out TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Gig Expenses
CREATE TABLE public.gig_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.gig_worker_profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    description TEXT NOT NULL,
    receipt_url TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Gig Disputes (Resolution Center)
CREATE TABLE public.gig_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
    initiator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    resolution_status TEXT NOT NULL DEFAULT 'Open' CHECK (resolution_status IN ('Open', 'In Review', 'Resolved_Worker_Favored', 'Resolved_Requester_Favored', 'Refunded')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Escrow field additions to Gigs table
ALTER TABLE public.gigs 
ADD COLUMN is_escrow_funded BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN verified_only_until TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.gig_worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_disputes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view verified status" ON public.gig_worker_profiles FOR SELECT USING (true);
CREATE POLICY "Workers manage their own profile" ON public.gig_worker_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Workers can log time" ON public.gig_time_logs FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Workers and Requesters can view time" ON public.gig_time_logs FOR SELECT USING (worker_id = auth.uid() OR EXISTS (SELECT 1 FROM public.gigs WHERE id = gig_id AND requester_id = auth.uid()));
CREATE POLICY "Workers can log expenses" ON public.gig_expenses FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Workers and Requesters can view expenses" ON public.gig_expenses FOR SELECT USING (worker_id = auth.uid() OR EXISTS (SELECT 1 FROM public.gigs WHERE id = gig_id AND requester_id = auth.uid()));
CREATE POLICY "Requesters can update expenses" ON public.gig_expenses FOR UPDATE USING (EXISTS (SELECT 1 FROM public.gigs WHERE id = gig_id AND requester_id = auth.uid()));
CREATE POLICY "Involved parties can view disputes" ON public.gig_disputes FOR SELECT USING (initiator_id = auth.uid() OR EXISTS (SELECT 1 FROM public.gig_applications WHERE gig_id = gig_disputes.gig_id AND applicant_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.gigs WHERE id = gig_id AND requester_id = auth.uid()));
CREATE POLICY "Involved parties can create disputes" ON public.gig_disputes FOR INSERT WITH CHECK (initiator_id = auth.uid());

-- Indexes
CREATE INDEX idx_gig_worker_verified ON public.gig_worker_profiles(is_verified);
CREATE INDEX idx_time_logs_gig ON public.gig_time_logs(gig_id);
CREATE INDEX idx_expenses_gig ON public.gig_expenses(gig_id);
CREATE INDEX idx_disputes_gig ON public.gig_disputes(gig_id);
