-- AUTO-SUSPENSION TRIGGER LOGIC
-- Enforces 3 strikes = 7 days suspension. Repeated within 30 days = 30 days suspension.

CREATE OR REPLACE FUNCTION calculate_suspension_penalty()
RETURNS TRIGGER AS $$
DECLARE
    recent_strikes INT;
    suspension_interval INTERVAL;
BEGIN
    -- 1. Count strikes in the last 30 days
    SELECT COUNT(*) INTO recent_strikes
    FROM public.user_strikes
    WHERE user_id = NEW.user_id
      AND created_at >= (NOW() - INTERVAL '30 days');

    -- 2. If strikes >= 3, they get a suspension
    IF recent_strikes >= 3 THEN
        -- If they hit exactly 3 strikes, it's their first 7-day penalty for this window.
        -- If they hit 4+ strikes, it's a repeat offense within 30 days, so 30 days penalty.
        IF recent_strikes = 3 THEN
            suspension_interval := INTERVAL '7 days';
        ELSE
            suspension_interval := INTERVAL '30 days';
        END IF;

        -- Update the profile
        UPDATE public.profiles
        SET suspended_until = NOW() + suspension_interval
        WHERE id = NEW.user_id;
        
        -- Insert a system log to notify admins
        INSERT INTO public.platform_activity (action_type, description, user_id)
        VALUES (
            'automated_suspension', 
            'Guardian AI suspended user ' || NEW.user_id || ' for ' || EXTRACT(DAY FROM suspension_interval) || ' days due to ' || recent_strikes || ' strikes.',
            NEW.user_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS trigger_guardian_auto_suspend ON public.user_strikes;
CREATE TRIGGER trigger_guardian_auto_suspend
AFTER INSERT ON public.user_strikes
FOR EACH ROW
EXECUTE FUNCTION calculate_suspension_penalty();
