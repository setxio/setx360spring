-- Migration: Who's Who City Managers (Historical & Current)
-- Adds City Managers to the civic directory for administrative context.

-- 1. Seed City Managers (Jefferson County)
INSERT INTO public.civic_directory (name, title, city, county, jurisdiction, is_active, tenure_start, tenure_end) VALUES
('Chris Boone', 'City Manager', 'Beaumont', 'Jefferson', 'city', true, '2026', 'Present'),
('Kenneth Williams', 'Former City Manager', 'Beaumont', 'Jefferson', 'city', false, '2022', '2026'),
('Kyle Hayes', 'Former City Manager', 'Beaumont', 'Jefferson', 'city', false, '2002', '2022'),

('Ron Burton', 'City Manager', 'Port Arthur', 'Jefferson', 'city', true, '2019', 'Present'),
('Rebecca Underhill', 'Former Interim City Manager', 'Port Arthur', 'Jefferson', 'city', false, '2019', '2019'),
('Harvey Robinson', 'Former Interim City Manager', 'Port Arthur', 'Jefferson', 'city', false, '2017', '2019'),
('Brian McDougal', 'Former City Manager', 'Port Arthur', 'Jefferson', 'city', false, '2015', '2017'),
('Floyd Johnson', 'Former Interim City Manager', 'Port Arthur', 'Jefferson', 'city', false, '2013', '2015'),

('Manuel De La Rosa', 'City Manager', 'Nederland', 'Jefferson', 'city', true, '2026', 'Present'),
('Chris Dupre', 'Former Interim City Manager', 'Nederland', 'Jefferson', 'city', false, '2025', '2026'),
('Chris Brister', 'Former City Manager', 'Nederland', 'Jefferson', 'city', false, '2019', '2025'),
('Terry Wright', 'Former City Manager', 'Nederland', 'Jefferson', 'city', false, '2006', '2019'),

('Andre Wimer', 'City Manager', 'Port Neches', 'Jefferson', 'city', true, '2014', 'Present'),
('Randy Kimler', 'Former City Manager', 'Port Neches', 'Jefferson', 'city', false, '2000', '2014'),

('Kevin Carruth', 'City Manager', 'Groves', 'Jefferson', 'city', true, '2023', 'Present'),
('Lance Billeaud', 'Former Interim City Manager', 'Groves', 'Jefferson', 'city', false, '2022', '2023'),
('D.E. Sosa', 'Former City Manager', 'Groves', 'Jefferson', 'city', false, '2003', '2022');

-- 2. Seed City Managers (Orange County)
INSERT INTO public.civic_directory (name, title, city, county, jurisdiction, is_active, tenure_start, tenure_end) VALUES
('Mike Kunst', 'City Manager', 'Orange', 'Orange', 'city', true, '2019', 'Present'),
('Kelvin Knauf', 'Former Interim City Manager', 'Orange', 'Orange', 'city', false, '2018', '2019'),
('Shawn Oubre', 'Former City Manager', 'Orange', 'Orange', 'city', false, '2006', '2018'),

('Aleta Cappen', 'Interim City Manager', 'Vidor', 'Orange', 'city', true, '2025', 'Present'),
('Rod Carroll', 'Former Interim City Manager', 'Vidor', 'Orange', 'city', false, '2025', '2025'),
('Robbie Hood', 'Former City Manager', 'Vidor', 'Orange', 'city', false, '2020', '2025'),

('Doug Schulze', 'City Manager', 'Bridge City', 'Orange', 'city', true, '2024', 'Present'),
('Chris Baker', 'Former City Manager', 'Bridge City', 'Orange', 'city', false, '2022', '2023'),
('Jerry Jones', 'Former City Manager', 'Bridge City', 'Orange', 'city', false, '2000', '2021');
