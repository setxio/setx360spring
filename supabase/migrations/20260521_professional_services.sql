-- Professional Services Schema Update
-- 1. Create Schedules Table (so pros can set their hours)
CREATE TABLE IF NOT EXISTS public.service_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(store_id, day_of_week)
);

-- 2. Create Bookings Table
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status booking_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE public.service_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- Schedules: Anyone can read, only store owner can write
CREATE POLICY "Schedules are viewable by everyone" ON public.service_schedules
    FOR SELECT USING (true);

CREATE POLICY "Store owners can manage schedules" ON public.service_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = service_schedules.store_id
            AND stores.owner_id = auth.uid()
        )
    );

-- Bookings: User can view their own, store owner can view their store's
CREATE POLICY "Users can view their own bookings" ON public.service_bookings
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = service_bookings.store_id
            AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert bookings" ON public.service_bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON public.service_bookings
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = service_bookings.store_id
            AND stores.owner_id = auth.uid()
        )
    );
