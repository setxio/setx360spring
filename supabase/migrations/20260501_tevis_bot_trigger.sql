-- 1. Enable HTTP Extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Trigger Function to Summon Tevis
CREATE OR REPLACE FUNCTION public.invoke_tevis_bot()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if "@tevis" is in the content (case-insensitive)
  -- and if the author isn't Tevis itself (to prevent loops)
  IF (NEW.content ILIKE '%@tevis%') AND (NEW.profile_id != 'bc1216fe-057f-4fed-8555-8c0e66ed29d3') THEN
    PERFORM net.http_post(
      url := 'https://okulcpbrikcumiomrzuh.supabase.co/functions/v1/tevis-bot',
      headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SUPABASE_SECRET'
    ),
      body := jsonb_build_object(
        'record', row_to_json(NEW)::jsonb
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS on_comment_created_tevis ON public.comments;
CREATE TRIGGER on_comment_created_tevis
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.invoke_tevis_bot();
