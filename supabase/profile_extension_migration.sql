-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Profile Extensions for Role-Specific Editing
-- ═══════════════════════════════════════════════════════════════════

-- Add professional and role-specific fields to the profiles table
DO $$
BEGIN
    -- Business / Professional Fields
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_category') THEN
        ALTER TABLE public.profiles ADD COLUMN business_category TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'store_type') THEN
        ALTER TABLE public.profiles ADD COLUMN store_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'return_policy') THEN
        ALTER TABLE public.profiles ADD COLUMN return_policy TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') THEN
        ALTER TABLE public.profiles ADD COLUMN website TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company') THEN
        ALTER TABLE public.profiles ADD COLUMN company TEXT;
    END IF;

    -- Personal / Residential Fields
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'occupation') THEN
        ALTER TABLE public.profiles ADD COLUMN occupation TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender TEXT;
    END IF;

    -- Identity Fields
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'handle') THEN
        ALTER TABLE public.profiles ADD COLUMN handle TEXT UNIQUE;
    END IF;

END $$;
