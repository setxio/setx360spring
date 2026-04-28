-- FIX: Add missing privacy columns to profiles table
-- Date: 2026-04-21

-- 1. Add columns with defaults
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_dms BOOLEAN DEFAULT TRUE;

-- 2. Update handle_new_user function to include these columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    first_name, 
    last_name, 
    email, 
    role, 
    zip, 
    community, 
    county, 
    state, 
    country, 
    location, 
    birth_month, 
    birth_day, 
    birth_year,
    is_public,
    allow_dms
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'resident'),
    new.raw_user_meta_data->>'zip',
    new.raw_user_meta_data->>'community',
    new.raw_user_meta_data->>'county',
    COALESCE(new.raw_user_meta_data->>'state', 'Texas'),
    COALESCE(new.raw_user_meta_data->>'country', 'USA'),
    COALESCE(new.raw_user_meta_data->>'location', 'Visitor'),
    (new.raw_user_meta_data->>'birth_month')::INT,
    (new.raw_user_meta_data->>'birth_day')::INT,
    (new.raw_user_meta_data->>'birth_year')::INT,
    COALESCE((new.raw_user_meta_data->>'is_public')::BOOLEAN, TRUE),
    COALESCE((new.raw_user_meta_data->>'allow_dms')::BOOLEAN, TRUE)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
