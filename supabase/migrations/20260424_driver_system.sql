-- Driver & Matching System

-- 1. Driver Profiles (Extends user profiles)
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_year INT,
    vehicle_plate TEXT,
    license_number TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    current_lat FLOAT,
    current_lng FLOAT,
    service_type TEXT CHECK (service_type IN ('rides', 'eats', 'both')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Favorite Drivers (Consumer preferences)
CREATE TABLE IF NOT EXISTS public.favorite_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, driver_id)
);

-- RLS
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_drivers ENABLE ROW LEVEL SECURITY;

-- Driver can update their own online status/location
CREATE POLICY "Drivers can manage own profile" 
ON public.driver_profiles FOR ALL 
USING (auth.uid() = id);

-- Anyone can see online drivers (for map/booking)
CREATE POLICY "Public can view online drivers" 
ON public.driver_profiles FOR SELECT 
USING (is_online = true AND is_verified = true);

-- Users manage their own favorites
CREATE POLICY "Users can manage own favorites" 
ON public.favorite_drivers FOR ALL 
USING (auth.uid() = user_id);

-- Notify schema change
NOTIFY pgrst, 'reload schema';
