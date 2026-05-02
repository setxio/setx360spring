-- Migration: Who's Who Civic Services & Leadership
-- Expands the directory to include Chamber/EDC leaders and all city/county service contacts.

-- 1. Seed Chamber and EDC Leaders into civic_directory
INSERT INTO public.civic_directory (name, title, city, county, jurisdiction, is_active) VALUES
('Amy Lovoi', 'President/CEO', 'Beaumont', 'Jefferson', 'chamber', true),
('Miles Haynes', 'Economic Development Manager', 'Beaumont', 'Jefferson', 'edc', true),
('Joe Tant', 'President/CEO', 'Port Arthur', 'Jefferson', 'chamber', true),
('Krystle Muller', 'Interim CEO', 'Port Arthur', 'Jefferson', 'edc', true),
('Ida Schossow', 'President', 'Orange', 'Orange', 'chamber', true),
('Jay Trahan', 'Director of Economic Development', 'Orange', 'Orange', 'edc', true),
('Megan Romero Layne', 'Executive Director', NULL, 'Orange', 'edc', true),
('Diana LaBorde', 'President', 'Nederland', 'Orange', 'chamber', true),
('Kay DeCuir', 'Executive Director', 'Nederland', 'Orange', 'edc', true),
('Lauren Rahe', 'Executive Director', 'Port Neches', 'Jefferson', 'chamber', true),
('Andre Guidroz', 'Director', 'Port Neches', 'Jefferson', 'edc', true),
('Patti Wolfe', 'Executive Director', 'Groves', 'Jefferson', 'chamber', true),
('Heather Hawthorn', 'President', 'Vidor', 'Orange', 'chamber', true),
('Rani Dillow', 'President', 'Bridge City', 'Orange', 'chamber', true);

-- 2. Create Civic Services Table
CREATE TABLE IF NOT EXISTS public.civic_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city TEXT,
    county TEXT NOT NULL,
    department TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    category TEXT NOT NULL, -- 'Emergency', 'Utilities', 'Administration', 'Business', 'Legal'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.civic_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view civic services" ON public.civic_services FOR SELECT USING (true);

-- 4. Seed Services (Jefferson County)
INSERT INTO public.civic_services (city, county, department, phone, address, category) VALUES
('Beaumont', 'Jefferson', 'City Hall', '(409) 880-3770', '801 Main Street, Beaumont, TX 77701', 'Administration'),
('Beaumont', 'Jefferson', 'Police Department (Non-Emergency)', '(409) 832-1234', '255 College St, Beaumont, TX 77701', 'Emergency'),
('Beaumont', 'Jefferson', 'Fire Department (Non-Emergency)', '(409) 880-3901', '400 Walnut St, Beaumont, TX 77701', 'Emergency'),
('Beaumont', 'Jefferson', 'Water Utilities', '(409) 866-0023', '801 Main St, Beaumont, TX 77701', 'Utilities'),
('Beaumont', 'Jefferson', 'Animal Care', '(409) 838-3304', '1884 Pine St, Beaumont, TX 77703', 'Administration'),
('Beaumont', 'Jefferson', 'Municipal Court', '(409) 980-7200', '700 Orleans St, Beaumont, TX 77701', 'Legal'),
('Beaumont', 'Jefferson', 'Chamber of Commerce', '(409) 838-6581', '1110 Park Street, Beaumont, TX 77701', 'Business'),
('Beaumont', 'Jefferson', 'Economic Development (EDC)', '(409) 835-7895', '550 Milam St, Beaumont, TX 77701', 'Business'),

('Port Arthur', 'Jefferson', 'City Hall', '(409) 983-8100', '444 4th St, Port Arthur, TX 77640', 'Administration'),
('Port Arthur', 'Jefferson', 'Police Department (Non-Emergency)', '(409) 983-8600', '645 4th St, Port Arthur, TX 77640', 'Emergency'),
('Port Arthur', 'Jefferson', 'Water Department', '(409) 983-8230', '444 4th St, Port Arthur, TX 77640', 'Utilities'),
('Port Arthur', 'Jefferson', 'Municipal Court', '(409) 983-8686', '645 4th St, Port Arthur, TX 77640', 'Legal'),
('Port Arthur', 'Jefferson', 'Chamber of Commerce', '(409) 963-1107', '501 Procter St Ste 300, Port Arthur, TX 77640', 'Business'),
('Port Arthur', 'Jefferson', 'Economic Development (EDC)', '(409) 963-0579', '444 4th Street, Port Arthur, TX 77640', 'Business'),

('Nederland', 'Jefferson', 'City Hall', '(409) 723-1503', '207 N. 12th St, Nederland, TX 77627', 'Administration'),
('Nederland', 'Jefferson', 'Police Department', '(409) 722-4965', '1400 Boston Ave, Nederland, TX 77627', 'Emergency'),
('Nederland', 'Jefferson', 'Fire Department', '(409) 723-1531', '1400 Boston Ave, Nederland, TX 77627', 'Emergency'),
('Nederland', 'Jefferson', 'Chamber of Commerce', '(409) 722-0279', '1515 Boston Ave, Nederland, TX 77627', 'Business'),
('Nederland', 'Jefferson', 'Economic Development (EDC)', '(409) 729-1020', '1519 Boston Avenue, Nederland, TX 77627', 'Business'),

('Port Neches', 'Jefferson', 'City Hall', '(409) 727-2182', '1005 Merriman St, Port Neches, TX 77651', 'Administration'),
('Port Neches', 'Jefferson', 'Police Department', '(409) 722-1424', '1200 Merriman St, Port Neches, TX 77651', 'Emergency'),
('Port Neches', 'Jefferson', 'Fire Department', '(409) 722-5885', '1200 Merriman St, Port Neches, TX 77651', 'Emergency'),
('Port Neches', 'Jefferson', 'Chamber of Commerce', '(409) 722-9154', '1110 Port Neches Ave, Port Neches, TX 77651', 'Business'),
('Port Neches', 'Jefferson', 'Economic Development (EDC)', '(409) 719-4211', '606 Magnolia Ave, Port Neches, TX 77651', 'Business'),

('Groves', 'Jefferson', 'City Hall', '(409) 960-5780', '3947 Lincoln Ave, Groves, TX 77619', 'Administration'),
('Groves', 'Jefferson', 'Police Department', '(409) 962-0244', '4201 Main Ave, Groves, TX 77619', 'Emergency'),
('Groves', 'Jefferson', 'Fire Department', '(409) 962-4460', '4201 Main Ave, Groves, TX 77619', 'Emergency'),
('Groves', 'Jefferson', 'Chamber of Commerce', '(409) 962-3631', '4399 Main Ave, Groves, TX 77619', 'Business'),

('Jefferson Co.', 'Jefferson', 'Main Courthouse', '(409) 835-8466', '1149 Pearl St, Beaumont, TX 77701', 'Legal'),
('Jefferson Co.', 'Jefferson', 'Sheriff Office', '(409) 835-8411', '1001 Pearl St, Beaumont, TX 77701', 'Emergency'),
('Jefferson Co.', 'Jefferson', 'Tax Assessor-Collector', '(409) 835-8516', '1149 Pearl St, Beaumont, TX 77701', 'Administration');

-- 5. Seed Services (Orange County)
INSERT INTO public.civic_services (city, county, department, phone, address, category) VALUES
('Orange', 'Orange', 'City Hall', '(409) 883-1081', '812 N 16th St, Orange, TX 77630', 'Administration'),
('Orange', 'Orange', 'Police Department', '(409) 883-1026', '201 8th St, Orange, TX 77630', 'Emergency'),
('Orange', 'Orange', 'Fire Department', '(409) 883-1050', '201 8th St, Orange, TX 77630', 'Emergency'),
('Orange', 'Orange', 'Municipal Court', '(409) 883-1063', '901 Main St, Orange, TX 77631', 'Legal'),
('Orange', 'Orange', 'Chamber of Commerce', '(409) 883-3536', '1012 Green Ave, Orange, TX 77630', 'Business'),
('Orange', 'Orange', 'Economic Development (EDC)', '(409) 883-1077', '812 N 16th Street, Orange, TX 77630', 'Business'),

('Vidor', 'Orange', 'City Hall', '(409) 769-5473', '1395 N Main St, Vidor, TX 77662', 'Administration'),
('Vidor', 'Orange', 'Police Department', '(409) 769-4561', '695 E Railroad St, Vidor, TX 77662', 'Emergency'),
('Vidor', 'Orange', 'Water (Vidor MUD)', '(409) 769-2666', '1215 N Main St, Vidor, TX 77662', 'Utilities'),
('Vidor', 'Orange', 'Chamber of Commerce', '(409) 681-6223', '1395 N. Main Ste 111, Vidor, TX 77662', 'Business'),

('Bridge City', 'Orange', 'City Hall', '(409) 735-6807', '260 N Valley View Dr, Bridge City, TX 77611', 'Administration'),
('Bridge City', 'Orange', 'Police Department', '(409) 735-3333', '260 Rachal Ave, Bridge City, TX 77611', 'Emergency'),
('Bridge City', 'Orange', 'Fire Department', '(409) 735-3323', '260 Rachal Ave, Bridge City, TX 77611', 'Emergency'),
('Bridge City', 'Orange', 'Chamber of Commerce', '(409) 735-5671', '150 W Round Bunch Rd, Bridge City, TX 77611', 'Business'),

('Orange Co.', 'Orange', 'Main Courthouse', '(409) 882-7000', '128 Wall St, Orange, TX 77630', 'Legal'),
('Orange Co.', 'Orange', 'Sheriff Office', '(409) 883-2612', '205 Border St, Orange, TX 77630', 'Emergency'),
('Orange Co.', 'Orange', 'Economic Development (EDC)', '(409) 883-7770', '123 S. 6th Street, Orange, TX 77630', 'Business');

-- 6. Search Function for Services
CREATE OR REPLACE FUNCTION public.search_civic_services(search_query TEXT, limit_count INT DEFAULT 15)
RETURNS TABLE (
    city TEXT,
    department TEXT,
    phone TEXT,
    address TEXT,
    category TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT s.city, s.department, s.phone, s.address, s.category
    FROM public.civic_services s
    WHERE (s.department ILIKE '%' || search_query || '%' OR s.city ILIKE '%' || search_query || '%' OR s.category ILIKE '%' || search_query || '%')
    ORDER BY s.category ASC, s.city ASC
    LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_civic_services(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_civic_services(TEXT, INT) TO service_role;
