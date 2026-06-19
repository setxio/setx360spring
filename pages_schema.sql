-- Pages System Schema

-- 1. `pages` table
CREATE TABLE IF NOT EXISTS public.pages (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  page_type text not null, -- e.g., 'business', 'artist', 'non_profit', 'venue', 'official'
  name text not null,
  avatar_url text,
  cover_url text,
  about text,
  contact_email text,
  contact_phone text,
  website text,
  social_facebook text,
  social_instagram text,
  social_x text,
  social_youtube text,
  social_tiktok text,
  type_metadata jsonb default '{}'::jsonb,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Everyone can view pages
CREATE POLICY "Pages are viewable by everyone" ON public.pages 
  FOR SELECT USING (true);

-- Authenticated users can insert their own pages
CREATE POLICY "Users can create pages" ON public.pages 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Only owners and admins can update the page
CREATE POLICY "Page owners can update their pages" ON public.pages 
  FOR UPDATE USING (auth.uid() = owner_id);

-- 2. `page_members` table (RBAC for multi-user management)
CREATE TABLE IF NOT EXISTS public.page_members (
  id uuid default gen_random_uuid() primary key,
  page_id uuid references public.pages(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  access_level text default 'contributor' check (access_level in ('admin', 'editor', 'contributor')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(page_id, user_id)
);

-- Enable RLS for Page Members
ALTER TABLE public.page_members ENABLE ROW LEVEL SECURITY;

-- Members can see who else is a member of their page
CREATE POLICY "Page members are viewable by everyone" ON public.page_members 
  FOR SELECT USING (true);

-- Only page owners (or admins) can add new members
-- For simplicity, checking if the current user is the owner of the page being modified
CREATE POLICY "Page owners can manage members" ON public.page_members 
  USING (
    EXISTS (
      SELECT 1 FROM public.pages 
      WHERE pages.id = page_members.page_id 
      AND pages.owner_id = auth.uid()
    )
  );
