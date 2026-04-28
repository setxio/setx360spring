-- Extensive Store Front Customization Schema
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS return_policy TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_vacation_mode BOOLEAN DEFAULT FALSE;

-- Custom Theming
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS custom_theme JSONB DEFAULT '{
  "primary_color": null,
  "header_color": null,
  "link_color": null,
  "hover_color": null,
  "bg_color": null,
  "bg_image_url": null,
  "bg_style": "cover" 
}'::jsonb;

-- Ratings System
CREATE TABLE IF NOT EXISTS public.store_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure policies for reviews
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON public.store_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can write reviews" ON public.store_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
