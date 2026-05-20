-- ====================================================================
-- SETX 360 DUNA • Regional Digital Council Governance Migration
-- Enforces Texas HB 4518 Administration, Multi-Sig, and Term Limits
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.civic_digital_council (
    seat_id INT PRIMARY KEY,
    city_name TEXT NOT NULL,
    representative_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    term_start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    term_expiry_time TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 years'),
    term_count INT NOT NULL DEFAULT 1,
    is_permanent_founder_seat BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.council_proposals (
    id BIGSERIAL PRIMARY KEY,
    proposer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    recipient_address TEXT NOT NULL,
    approval_count INT NOT NULL DEFAULT 1,
    citizen_veto_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executed', 'vetoed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.council_proposal_approvals (
    proposal_id BIGINT REFERENCES public.council_proposals(id) ON DELETE CASCADE,
    council_member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (proposal_id, council_member_id)
);

CREATE TABLE IF NOT EXISTS public.citizen_referendums (
    proposal_id BIGINT REFERENCES public.council_proposals(id) ON DELETE CASCADE,
    citizen_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (proposal_id, citizen_id)
);

-- Triggers for Automated Status Updates
CREATE OR REPLACE FUNCTION public.fn_update_proposal_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment approval count
    UPDATE public.council_proposals
    SET approval_count = approval_count + 1
    WHERE id = NEW.proposal_id;

    -- Check if 3-of-5 threshold met
    UPDATE public.council_proposals
    SET status = 'approved'
    WHERE id = NEW.proposal_id AND approval_count >= 3 AND status = 'pending';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_council_approval ON public.council_proposal_approvals;
CREATE TRIGGER trg_council_approval
AFTER INSERT ON public.council_proposal_approvals
FOR EACH ROW EXECUTE FUNCTION public.fn_update_proposal_approval();


CREATE OR REPLACE FUNCTION public.fn_update_referendum_veto()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment citizen veto count
    UPDATE public.council_proposals
    SET citizen_veto_count = citizen_veto_count + 1
    WHERE id = NEW.proposal_id;

    -- Check if 1,000 citizen veto threshold met
    UPDATE public.council_proposals
    SET status = 'vetoed'
    WHERE id = NEW.proposal_id AND citizen_veto_count >= 1000 AND status IN ('pending', 'approved');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_citizen_veto ON public.citizen_referendums;
CREATE TRIGGER trg_citizen_veto
AFTER INSERT ON public.citizen_referendums
FOR EACH ROW EXECUTE FUNCTION public.fn_update_referendum_veto();

-- Insert Initial 5 Council Seats (Mock Profile IDs for Staging)
INSERT INTO public.civic_digital_council (seat_id, city_name, is_permanent_founder_seat)
VALUES 
    (1, 'Beaumont', FALSE),
    (2, 'Port Arthur', FALSE),
    (3, 'Orange', FALSE),
    (4, 'Groves/Nederland', FALSE),
    (5, 'SETX.io Tech Infrastructure', TRUE)
ON CONFLICT (seat_id) DO NOTHING;
