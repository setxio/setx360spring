-- Gig Updates (Disputes and Deliverables)
DROP TABLE IF EXISTS public.gig_disputes CASCADE;

CREATE TABLE public.gig_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.gig_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view disputes" ON public.gig_disputes FOR SELECT USING (true);
CREATE POLICY "Involved parties can create disputes" ON public.gig_disputes FOR INSERT WITH CHECK (requester_id = auth.uid() OR worker_id = auth.uid());

CREATE INDEX idx_gig_disputes_gig ON public.gig_disputes(gig_id);
CREATE INDEX idx_gig_disputes_worker ON public.gig_disputes(worker_id);
CREATE INDEX idx_gig_disputes_status ON public.gig_disputes(status);

ALTER TABLE public.gig_applications ADD COLUMN IF NOT EXISTS deliverable_url TEXT;
