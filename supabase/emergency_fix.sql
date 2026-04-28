-- ═══════════════════════════════════════════════════════════════════
-- EMERGENCY REPAIR: Disable problematic HTTP triggers
-- This ensures the app is USABLE for posting while we debug pg_net.
-- ═══════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS tr_classify_post ON public.posts;
DROP TRIGGER IF EXISTS tr_moderate_post ON public.posts;
DROP TRIGGER IF EXISTS tr_follow_suggestions ON public.posts;

-- Also drop them if they were in any other schema (though unlikely)
-- DROP TRIGGER IF EXISTS tr_classify_post ON public.posts CASCADE;

NOTIFY pgrst, 'reload schema';
