-- 1. Create the table: zip_to_city_location_mapping
CREATE TABLE IF NOT EXISTS public.zip_to_city_location_mapping (
  id SERIAL PRIMARY KEY,
  zip_code VARCHAR(10) NOT NULL,
  city_name VARCHAR(100) NOT NULL,
  county_name VARCHAR(100) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Unique Constraint to prevent surgical duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_zip_city ON public.zip_to_city_location_mapping (zip_code, city_name);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.zip_to_city_location_mapping ENABLE ROW LEVEL SECURITY;

-- 4. Create a policy to allow everyone to read
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'zip_to_city_location_mapping') THEN
    CREATE POLICY "Allow public read access" ON public.zip_to_city_location_mapping FOR SELECT USING (true);
  END IF;
END $$;
