CREATE TABLE IF NOT EXISTS public.flash_liquidations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    discount_percentage INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE OR REPLACE FUNCTION set_expires_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expires_at := NEW.created_at + (NEW.duration_minutes || ' minutes')::interval;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_expires_at ON flash_liquidations;
CREATE TRIGGER trg_set_expires_at
BEFORE INSERT ON flash_liquidations
FOR EACH ROW
EXECUTE FUNCTION set_expires_at();

ALTER TABLE public.flash_liquidations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores can create their own flash liquidations"
ON public.flash_liquidations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = flash_liquidations.store_id 
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view active flash liquidations"
ON public.flash_liquidations FOR SELECT
USING (status = 'active');
