-- Create classified_items table
CREATE TABLE IF NOT EXISTS public.classified_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    price numeric NOT NULL,
    location text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    images text[] DEFAULT '{}'::text[],
    status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on classified_items
ALTER TABLE public.classified_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classified_items
CREATE POLICY "Anyone can view active classified items"
ON public.classified_items FOR SELECT
USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own classified items"
ON public.classified_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classified items"
ON public.classified_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classified items"
ON public.classified_items FOR DELETE
USING (auth.uid() = user_id);

-- Create classified_favorites table
CREATE TABLE IF NOT EXISTS public.classified_favorites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    item_id uuid REFERENCES public.classified_items(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, item_id)
);

-- Enable RLS on classified_favorites
ALTER TABLE public.classified_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classified_favorites
CREATE POLICY "Users can view their own favorites"
ON public.classified_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
ON public.classified_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.classified_favorites FOR DELETE
USING (auth.uid() = user_id);
