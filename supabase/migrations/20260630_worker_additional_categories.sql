ALTER TABLE gig_worker_profiles
ADD COLUMN IF NOT EXISTS additional_categories text[] DEFAULT '{}'::text[];
