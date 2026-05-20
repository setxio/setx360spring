-- =============================================================================
-- SETX 360: Civic Identity & Voting Separation (One Citizen, One Vote)
-- =============================================================================

-- 1. Add strict Proof of Residency flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified_resident BOOLEAN DEFAULT false NOT NULL;

-- 2. Create the civic_proposals table for community governance
CREATE TABLE IF NOT EXISTS public.civic_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- 3. Create the ballot_votes table with airtight civic constraints
CREATE TABLE IF NOT EXISTS public.ballot_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES public.civic_proposals(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    vote_choice TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Mathematically enforce One-Citizen-One-Vote per proposal at the database level
ALTER TABLE public.ballot_votes
ADD CONSTRAINT unique_vote_per_citizen UNIQUE (proposal_id, profile_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.civic_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ballot_votes ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Civic Proposals
CREATE POLICY "Anyone can view active proposals" ON public.civic_proposals
    FOR SELECT USING (true);

-- 6. Strict Policies for Ballot Votes
-- Admins and the voter themselves can view their vote
CREATE POLICY "Users can view their own votes" ON public.ballot_votes
    FOR SELECT USING (profile_id = auth.uid());

-- THE FIREWALL: A user can only vote if they are the authenticated user AND they are a verified resident
CREATE POLICY "Only verified residents can cast a vote" ON public.ballot_votes
    FOR INSERT WITH CHECK (
        profile_id = auth.uid() 
        AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_verified_resident = true
        )
    );

-- Votes are immutable (cannot be updated or deleted by the user after casting)
-- (No UPDATE or DELETE policies granted to public)
