-- Pro+ Tables

-- 1. pro_profiles
CREATE TABLE IF NOT EXISTS public.pro_profiles (
  id uuid references auth.users on delete cascade primary key,
  pro_avatar_url text,
  headline text,
  about text,
  industry text,
  resume_url text,
  cover_letter_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.pro_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pro profiles are viewable by everyone" ON public.pro_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own pro profile" ON public.pro_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own pro profile" ON public.pro_profiles FOR UPDATE USING (auth.uid() = id);

-- 2. pro_experiences
CREATE TABLE IF NOT EXISTS public.pro_experiences (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.pro_profiles(id) on delete cascade not null,
  company_name text not null,
  title text not null,
  start_date date,
  end_date date,
  is_current boolean default false,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.pro_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pro experiences are viewable by everyone" ON public.pro_experiences FOR SELECT USING (true);
CREATE POLICY "Users can manage their own pro experiences" ON public.pro_experiences USING (auth.uid() = profile_id);

-- 3. pro_education
CREATE TABLE IF NOT EXISTS public.pro_education (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.pro_profiles(id) on delete cascade not null,
  school_name text not null,
  degree text,
  field_of_study text,
  start_date date,
  end_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.pro_education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pro education is viewable by everyone" ON public.pro_education FOR SELECT USING (true);
CREATE POLICY "Users can manage their own pro education" ON public.pro_education USING (auth.uid() = profile_id);

-- 4. pro_connections
CREATE TABLE IF NOT EXISTS public.pro_connections (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references auth.users(id) on delete cascade not null,
  recipient_id uuid references auth.users(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(requester_id, recipient_id)
);

ALTER TABLE public.pro_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pro connections viewable by users involved" ON public.pro_connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can create connection requests" ON public.pro_connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update connection requests they are involved in" ON public.pro_connections FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can delete connection requests they are involved in" ON public.pro_connections FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
