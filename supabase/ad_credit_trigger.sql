-- ═══════════════════════════════════════════════════════════════════
-- AD CREDIT SYSTEM: Automatic deduction on approval
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.deduct_ad_credit_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only deduct if status changes from anything to 'active'
  IF (OLD.status IS NULL OR OLD.status != 'active') AND NEW.status = 'active' THEN
    -- Check if user has credits
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.profile_id AND ad_credits > 0) THEN
      UPDATE public.profiles 
      SET ad_credits = ad_credits - 1 
      WHERE id = NEW.profile_id;
    ELSE
      -- If no credits, prevent activation (optional, or just allow it if it's admin approved)
      -- For now, we allow it but log a warning if needed.
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_deduct_ad_credit ON public.ads;
CREATE TRIGGER tr_deduct_ad_credit
  AFTER UPDATE OF status ON public.ads
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION public.deduct_ad_credit_on_approval();
