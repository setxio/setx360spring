-- Adding Slug and Custom Domain support to Stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_domain ON stores(custom_domain);

-- Backfill slugs for existing stores based on name
UPDATE stores SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]', '-', 'g')) WHERE slug IS NULL;
