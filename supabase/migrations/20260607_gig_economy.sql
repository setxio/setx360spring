-- Gig Economy Tables

CREATE TABLE public.gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Local', 'Remote')),
    urgency TEXT NOT NULL CHECK (urgency IN ('ASAP', 'Flexible', 'Scheduled')),
    compensation_amount TEXT NOT NULL,
    compensation_type TEXT NOT NULL CHECK (compensation_type IN ('Flat', 'Hourly')),
    location TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Completed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.gig_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected', 'Completed')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(gig_id, applicant_id)
);

-- Enable RLS
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_applications ENABLE ROW LEVEL SECURITY;

-- Gigs Policies
CREATE POLICY "Anyone can view active gigs"
    ON public.gigs
    FOR SELECT
    USING (status = 'Active' OR requester_id = auth.uid());

CREATE POLICY "Authenticated users can create gigs"
    ON public.gigs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND requester_id = auth.uid());

CREATE POLICY "Requesters can update their own gigs"
    ON public.gigs
    FOR UPDATE
    USING (requester_id = auth.uid());

-- Gig Applications Policies
CREATE POLICY "Requesters can view applications to their gigs"
    ON public.gig_applications
    FOR SELECT
    USING (
        applicant_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.gigs g 
            WHERE g.id = gig_id AND g.requester_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can apply to active gigs"
    ON public.gig_applications
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        applicant_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.gigs g 
            WHERE g.id = gig_id AND g.status = 'Active'
        )
    );

CREATE POLICY "Requesters and applicants can update applications"
    ON public.gig_applications
    FOR UPDATE
    USING (
        applicant_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.gigs g 
            WHERE g.id = gig_id AND g.requester_id = auth.uid()
        )
    );

-- Indices for performance
CREATE INDEX idx_gigs_requester ON public.gigs(requester_id);
CREATE INDEX idx_gigs_category ON public.gigs(category_id);
CREATE INDEX idx_gigs_status ON public.gigs(status);
CREATE INDEX idx_gig_apps_gig ON public.gig_applications(gig_id);
CREATE INDEX idx_gig_apps_applicant ON public.gig_applications(applicant_id);
