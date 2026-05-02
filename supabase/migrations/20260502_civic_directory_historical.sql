-- Migration: Who's Who Historical Context (10 Years)
-- Expands the civic directory with former officials from 2014-2024.

-- 1. Add tenure and status columns
ALTER TABLE public.civic_directory ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.civic_directory ADD COLUMN IF NOT EXISTS tenure_start TEXT;
ALTER TABLE public.civic_directory ADD COLUMN IF NOT EXISTS tenure_end TEXT;

-- 2. Update existing (current) officials to be active
UPDATE public.civic_directory SET is_active = true WHERE is_active IS NULL;

-- 3. Seed Former Officials (Jefferson County)
INSERT INTO public.civic_directory (name, title, city, county, jurisdiction, is_active, tenure_start, tenure_end) VALUES
('Becky Ames', 'Former Mayor', 'Beaumont', 'Jefferson', 'city', false, '2007', '2021'),
('W.L. Pate Jr.', 'Former Council Member At-Large', 'Beaumont', 'Jefferson', 'city', false, '2007', '2021'),
('Audwin Samuel', 'Former Council Member Ward 3', 'Beaumont', 'Jefferson', 'city', false, NULL, '2021'),
('Gethrel Williams-Wright', 'Former Council Member Ward 1', 'Beaumont', 'Jefferson', 'city', false, NULL, '2019'),
('Robin Mouton', 'Former Mayor Pro Tem / Council Member', 'Beaumont', 'Jefferson', 'city', false, NULL, '2021'),
('Mike Getz', 'Former Council Member Ward 2', 'Beaumont', 'Jefferson', 'city', false, NULL, '2025'),

('Derrick Freeman', 'Former Mayor', 'Port Arthur', 'Jefferson', 'city', false, '2016', '2019'),
('Harold Doucet', 'Former Mayor', 'Port Arthur', 'Jefferson', 'city', false, NULL, '2016'),
('Willie "Bae" Lewis Jr.', 'Former Councilmember District 1', 'Port Arthur', 'Jefferson', 'city', false, NULL, '2020'),
('Kaprina Richardson Frank', 'Former Councilmember', 'Port Arthur', 'Jefferson', 'city', false, NULL, '2019'),

('Dick Nugent', 'Former Mayor', 'Nederland', 'Jefferson', 'city', false, NULL, '2019'),
('Glenn Johnson', 'Former Mayor', 'Port Neches', 'Jefferson', 'city', false, '2002', '2025'),
('Brad Bailey', 'Former Mayor', 'Groves', 'Jefferson', 'city', false, '2010', '2024'),
('Cross Coburn', 'Former Council Member (Recalled)', 'Groves', 'Jefferson', 'city', false, NULL, '2018'),
('Rhonda Dugas', 'Former Council Member Ward 4', 'Groves', 'Jefferson', 'city', false, NULL, '2024'),

('Eddie Arnold', 'Former County Commissioner Pct 1', NULL, 'Jefferson', 'county', false, NULL, '2020'),
('Rodney Townsend', 'Former County Commissioner Pct 1', NULL, 'Jefferson', 'county', false, '2020', '2024'),
('Brent Weaver', 'Former County Commissioner Pct 2', NULL, 'Jefferson', 'county', false, NULL, '2022'),
('Bob Wortham', 'Former 58th District Judge', NULL, 'Jefferson', 'district', false, NULL, '2014'),
('Donald Floyd', 'Former 172nd District Judge', NULL, 'Jefferson', 'district', false, NULL, '2019'),
('Gary Sanderson', 'Former 60th District Judge', NULL, 'Jefferson', 'district', false, NULL, '2016'),
('Milton Gunn Shuffield', 'Former 136th District Judge', NULL, 'Jefferson', 'district', false, NULL, '2016');

-- 4. Seed Former Officials (Orange County)
INSERT INTO public.civic_directory (name, title, city, county, jurisdiction, is_active, tenure_start, tenure_end) VALUES
('Larry Spears Jr.', 'Former Mayor', 'Orange', 'Orange', 'city', false, '2018', '2024'),
('Jimmy Henson', 'Former Mayor', 'Orange', 'Orange', 'city', false, NULL, '2018'),
('Patrick Pullen', 'Former Council Member District 1', 'Orange', 'Orange', 'city', false, NULL, '2024'),
('Bill Kutch', 'Former Council Member', 'Orange', 'Orange', 'city', false, NULL, '2018'),

('Robert Viator Jr.', 'Former Mayor', 'Vidor', 'Orange', 'city', false, NULL, '2019'),
('Kirk Roccaforte', 'Former Mayor', 'Bridge City', 'Orange', 'city', false, NULL, '2016'),

('Stephen Brint Carlton', 'Former County Judge', NULL, 'Orange', 'county', false, NULL, '2018'),
('Dean Crooks', 'Former County Judge', NULL, 'Orange', 'county', false, '2018', '2019'),
('Barry Burton', 'Former County Commissioner Pct 2', NULL, 'Orange', 'county', false, NULL, '2018'),
('Theresa Beauchamp', 'Former County Commissioner Pct 2', NULL, 'Orange', 'county', false, '2018', '2022'),
('Jody Crump', 'Former County Commissioner Pct 4', NULL, 'Orange', 'county', false, NULL, '2018'),
('Buddie Hahn', 'Former 260th District Judge', NULL, 'Orange', 'district', false, NULL, '2016'),
('Dennis Powell', 'Former 163rd District Judge', NULL, 'Orange', 'district', false, NULL, '2022');

-- 5. Update Search Function to include tenure and status
DROP FUNCTION IF EXISTS public.search_civic_directory(search_query TEXT, limit_count INT);

CREATE OR REPLACE FUNCTION public.search_civic_directory(search_query TEXT, limit_count INT DEFAULT 20)
RETURNS TABLE (
    name TEXT,
    title TEXT,
    city TEXT,
    county TEXT,
    jurisdiction TEXT,
    is_active BOOLEAN,
    tenure_start TEXT,
    tenure_end TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT c.name, c.title, c.city, c.county, c.jurisdiction, c.is_active, c.tenure_start, c.tenure_end
    FROM public.civic_directory c
    WHERE (c.name ILIKE '%' || search_query || '%' OR c.city ILIKE '%' || search_query || '%' OR c.title ILIKE '%' || search_query || '%')
    ORDER BY c.is_active DESC, c.jurisdiction ASC, c.city ASC, c.name ASC
    LIMIT limit_count;
END;
$$;
