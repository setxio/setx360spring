-- Migration: Who's Who Civic Directory
-- Creates a directory of city and county officials for Tevis to digest.

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.civic_directory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    city TEXT,
    county TEXT NOT NULL,
    jurisdiction TEXT NOT NULL, -- 'city', 'county', 'district', 'state'
    bio TEXT,
    contact_info JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.civic_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view civic directory" ON public.civic_directory FOR SELECT USING (true);

-- 3. Seed Data (Jefferson County)
INSERT INTO public.civic_directory (name, title, city, county, jurisdiction) VALUES
('Roy West', 'Mayor', 'Beaumont', 'Jefferson', 'city'),
('Albert "A.J." Turner', 'Mayor Pro Tem / Council Member At-Large', 'Beaumont', 'Jefferson', 'city'),
('Mike Williams', 'Council Member At-Large', 'Beaumont', 'Jefferson', 'city'),
('Cory Crenshaw', 'Council Member Ward 1', 'Beaumont', 'Jefferson', 'city'),
('Joseph Hilliard', 'Council Member Ward 2', 'Beaumont', 'Jefferson', 'city'),
('LaDonna Sherwood', 'Council Member Ward 3', 'Beaumont', 'Jefferson', 'city'),
('Chris Durio', 'Council Member Ward 4', 'Beaumont', 'Jefferson', 'city'),

('Charlotte M. Moses', 'Mayor', 'Port Arthur', 'Jefferson', 'city'),
('Willie "Bae" Lewis, Jr.', 'Councilmember District 1', 'Port Arthur', 'Jefferson', 'city'),
('Tiffany L. Hamilton Everfield', 'Councilmember District 2', 'Port Arthur', 'Jefferson', 'city'),
('Doneane Beckcom', 'Councilmember District 3', 'Port Arthur', 'Jefferson', 'city'),
('Harold Doucet, Sr.', 'Mayor Pro Tem / District 4', 'Port Arthur', 'Jefferson', 'city'),
('Thomas Kinlaw, III', 'Councilmember At-Large (Position 5)', 'Port Arthur', 'Jefferson', 'city'),
('Donald Frank, Sr.', 'Councilmember At-Large (Position 6)', 'Port Arthur', 'Jefferson', 'city'),

('Jeff Darby', 'Mayor', 'Nederland', 'Jefferson', 'city'),
('Bret Duplant', 'Council Member Ward 1', 'Nederland', 'Jefferson', 'city'),
('Britton Jones', 'Council Member Ward 2', 'Nederland', 'Jefferson', 'city'),
('Randy Sonnier', 'Council Member Ward 3', 'Nederland', 'Jefferson', 'city'),
('Jeff Ortiz', 'Mayor Pro Tem / Ward 4', 'Nederland', 'Jefferson', 'city'),

('Robert Arnold', 'Mayor', 'Port Neches', 'Jefferson', 'city'),
('Heather Burton', 'Council Member Place 1', 'Port Neches', 'Jefferson', 'city'),
('Adam Anders', 'Council Member Place 2', 'Port Neches', 'Jefferson', 'city'),
('Jim Wallace', 'Council Member Place 3', 'Port Neches', 'Jefferson', 'city'),
('Paul Lemoine', 'Council Member Place 4', 'Port Neches', 'Jefferson', 'city'),
('Terry Schwertner', 'Council Member Place 5', 'Port Neches', 'Jefferson', 'city'),

('Chris Borne', 'Mayor', 'Groves', 'Jefferson', 'city'),
('Mark McAdams', 'Council Member Ward 1', 'Groves', 'Jefferson', 'city'),
('Brandon Holmes', 'Council Member Ward 2', 'Groves', 'Jefferson', 'city'),
('Charles Chelette', 'Council Member Ward 3', 'Groves', 'Jefferson', 'city'),
('Rae Shauna Gay', 'Mayor Pro Tem / Ward 4', 'Groves', 'Jefferson', 'city'),

('Jeff Branick', 'County Judge', NULL, 'Jefferson', 'county'),
('Brandon Willis', 'Commissioner Pct 1', NULL, 'Jefferson', 'county'),
('Cary Erickson', 'Commissioner Pct 2', NULL, 'Jefferson', 'county'),
('Michael "Shane" Sinegal', 'Commissioner Pct 3', NULL, 'Jefferson', 'county'),
('Everette "Bo" Alfred', 'Commissioner Pct 4', NULL, 'Jefferson', 'county'),
('Kent Walston', '58th District Court Judge', NULL, 'Jefferson', 'district'),
('Justin Gary', '60th District Court Judge', NULL, 'Jefferson', 'district'),
('Baylor Wortham', '136th District Court Judge', NULL, 'Jefferson', 'district'),
('Mitch Templeton', '172nd District Court Judge', NULL, 'Jefferson', 'district'),
('Raquel West', '252nd District Court Judge', NULL, 'Jefferson', 'district'),
('Jay Cherry', '279th District Court Judge', NULL, 'Jefferson', 'district'),
('Gordon Friesz', '317th District Court Judge', NULL, 'Jefferson', 'district'),
('Gerald Eddins', 'County Court at Law #1 Judge', NULL, 'Jefferson', 'county'),
('Terrence Holmes', 'County Court at Law #2 Judge', NULL, 'Jefferson', 'county'),
('Clint Woods', 'County Court at Law #3 Judge', NULL, 'Jefferson', 'county');

-- 4. Seed Data (Orange County)
INSERT INTO public.civic_directory (name, title, city, county, jurisdiction) VALUES
('Larry Spears Jr.', 'Mayor', 'Orange', 'Orange', 'city'),
('Matt Chandler', 'Council Member District 1', 'Orange', 'Orange', 'city'),
('Brad Childs', 'Mayor Pro Tem / District 2', 'Orange', 'Orange', 'city'),
('Terrie T. Salter', 'Council Member District 3', 'Orange', 'Orange', 'city'),
('Mary McKenna', 'Council Member District 4', 'Orange', 'Orange', 'city'),
('George T. Mortimer', 'Council Member At-Large Place 5', 'Orange', 'Orange', 'city'),
('Paul Burch', 'Council Member At-Large Place 6', 'Orange', 'Orange', 'city'),

('Misty Songe Hart', 'Mayor', 'Vidor', 'Orange', 'city'),
('Kelly Carder', 'Council Member Ward 1', 'Vidor', 'Orange', 'city'),
('Nicole McGowan', 'Council Member Ward 2', 'Vidor', 'Orange', 'city'),
('Michael Thompson', 'Council Member Ward 3', 'Vidor', 'Orange', 'city'),
('Jessica Barker', 'Mayor Pro-tem / Ward 4', 'Vidor', 'Orange', 'city'),
('MiKayla Bourque', 'Council Member Ward 5', 'Vidor', 'Orange', 'city'),
('Debra Gatlin', 'Council Member Ward 6', 'Vidor', 'Orange', 'city'),

('Aaron Roccaforte', 'Mayor', 'Bridge City', 'Orange', 'city'),
('Gina Mannino', 'Council Member Place 2', 'Bridge City', 'Orange', 'city'),
('Bryant Champagne', 'Council Member Place 3', 'Bridge City', 'Orange', 'city'),
('Patty Collins', 'Council Member Place 4', 'Bridge City', 'Orange', 'city'),
('Chris Bouley', 'Council Member Place 5', 'Bridge City', 'Orange', 'city'),
('Sherby Dixon', 'Council Member Place 6', 'Bridge City', 'Orange', 'city'),

('John Gothia', 'County Judge', NULL, 'Orange', 'county'),
('Johnny Trahan', 'Commissioner Pct 1', NULL, 'Orange', 'county'),
('Chris Sowell', 'Commissioner Pct 2', NULL, 'Orange', 'county'),
('Kirk Roccaforte', 'Commissioner Pct 3', NULL, 'Orange', 'county'),
('Robert Viator', 'Commissioner Pct 4', NULL, 'Orange', 'county'),
('Courtney Arkeen', '128th District Court Judge', NULL, 'Orange', 'district'),
('Rex Peveto', '163rd District Court Judge', NULL, 'Orange', 'district'),
('Steven Parkhurst', '260th District Court Judge', NULL, 'Orange', 'district'),
('Mandy White-Rogers', 'County Court at Law #1 Judge', NULL, 'Orange', 'county'),
('Troy Johnson', 'County Court at Law #2 Judge', NULL, 'Orange', 'county');

-- 5. Search Function for Tevis
CREATE OR REPLACE FUNCTION public.search_civic_directory(search_query TEXT, limit_count INT DEFAULT 20)
RETURNS TABLE (
    name TEXT,
    title TEXT,
    city TEXT,
    county TEXT,
    jurisdiction TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT c.name, c.title, c.city, c.county, c.jurisdiction
    FROM public.civic_directory c
    WHERE (c.name ILIKE '%' || search_query || '%' OR c.city ILIKE '%' || search_query || '%' OR c.title ILIKE '%' || search_query || '%')
    ORDER BY c.jurisdiction ASC, c.city ASC, c.name ASC
    LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_civic_directory(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_civic_directory(TEXT, INT) TO service_role;
