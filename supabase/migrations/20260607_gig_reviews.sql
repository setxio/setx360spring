-- Gig Reviews
CREATE TABLE public.gig_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.gig_worker_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_auto_generated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(gig_id, reviewer_id)
);

-- Enable RLS
ALTER TABLE public.gig_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view gig reviews" ON public.gig_reviews FOR SELECT USING (true);
CREATE POLICY "Requesters can create reviews" ON public.gig_reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Indexes
CREATE INDEX idx_gig_reviews_worker ON public.gig_reviews(worker_id);
CREATE INDEX idx_gig_reviews_gig ON public.gig_reviews(gig_id);

-- Function to Auto-Complete Missing Reviews (10-day rule)
-- This function can be called daily by a cron job or pg_cron
CREATE OR REPLACE FUNCTION public.process_auto_gig_reviews()
RETURNS void AS $$
BEGIN
    INSERT INTO public.gig_reviews (gig_id, reviewer_id, worker_id, rating, review_text, is_auto_generated)
    SELECT 
        g.id AS gig_id,
        g.requester_id AS reviewer_id,
        ga.applicant_id AS worker_id,
        5 AS rating,
        'Auto-generated 5-star review (No rating provided within 10 days of completion).' AS review_text,
        true AS is_auto_generated
    FROM public.gigs g
    JOIN public.gig_applications ga ON g.id = ga.gig_id AND ga.status = 'Accepted'
    LEFT JOIN public.gig_reviews gr ON g.id = gr.gig_id AND g.requester_id = gr.reviewer_id
    WHERE g.status = 'Completed'
      AND g.updated_at < (now() - interval '10 days')
      AND gr.id IS NULL; -- No existing review
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
