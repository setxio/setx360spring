-- ═══════════════════════════════════════════════════════════════════
-- AUDIT FIX: Final Role Mapping & Hardcode Cleanup
-- ═══════════════════════════════════════════════════════════════════

-- 1. Complete Role Mapping in Auto-Approve Function
CREATE OR REPLACE FUNCTION public.auto_approve_stale_ads()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_rec RECORD;
BEGIN
  -- 1. Auto-approve stale ads (24h)
  UPDATE public.ads 
  SET status = 'active', updated_at = NOW()
  WHERE status = 'pending' 
    AND created_at < NOW() - INTERVAL '24 hours';
    
  -- 2. Auto-approve stale verifications (72h) AND update profile roles
  FOR v_rec IN 
    SELECT id, profile_id, role_requested 
    FROM public.verifications 
    WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '72 hours'
  LOOP
    -- Update verification record
    UPDATE public.verifications SET status = 'approved' WHERE id = v_rec.id;
    
    -- Update profile role (Map to verified version)
    UPDATE public.profiles 
    SET role = CASE 
      WHEN v_rec.role_requested = 'resident' THEN 'v_resident'
      WHEN v_rec.role_requested = 'business' THEN 'v_business'
      WHEN v_rec.role_requested = 'venue' THEN 'v_venue'
      WHEN v_rec.role_requested = 'media' THEN 'v_media'
      WHEN v_rec.role_requested = 'non_profit' THEN 'v_non_profit'
      WHEN v_rec.role_requested = 'church' THEN 'v_church'
      WHEN v_rec.role_requested = 'official' THEN 'v_official'
      WHEN v_rec.role_requested = 'artist' THEN 'v_artist'
      WHEN v_rec.role_requested = 'chamber' THEN 'v_chamber'
      ELSE role -- keep current if no match
    END
    WHERE id = v_rec.profile_id;
  END LOOP;
END;
$function$;

-- 2. Ensure default state is dynamic or blank for visitors
-- (Handled in frontend but good to have sane DB default)
ALTER TABLE public.profiles ALTER COLUMN state DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN state SET DEFAULT NULL;
