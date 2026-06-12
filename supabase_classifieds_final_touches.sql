-- Add views column
ALTER TABLE public.classified_items ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Add item_details column for category-specific fields (like apparel size, color, gender)
ALTER TABLE public.classified_items ADD COLUMN IF NOT EXISTS item_details JSONB;

-- Create an RPC to safely increment views without needing update permissions on the whole row
CREATE OR REPLACE FUNCTION increment_classified_view(p_item_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.classified_items
  SET views = COALESCE(views, 0) + 1
  WHERE id = p_item_id;
END;
$$;
