-- SETX360 COMPREHENSIVE PLATFORM SCHEMA (Sanitized & Isolated)
-- DATABASE: PostgreSQL (via Supabase)

--------------------------------------------------------------------------------
-- 1. EXTENSIONS & SETUP
--------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 2. CORE PROFILES (Extends Auth.Users)
--------------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'resident' CHECK (role IN (
    'admin', 
    'resident', 'v_resident', 
    'business', 'v_business', 
    'official', 'v_official', 
    'venue', 'v_venue', 
    'media', 'v_media', 
    'non_profit', 'v_non_profit', 
    'church', 'v_church'
  )),
  zip TEXT,
  community TEXT,
  county TEXT,
  state TEXT,
  country TEXT,
  location TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  birth_month INT,
  birth_day INT,
  birth_year INT,
  ad_credits INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-sync profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, first_name, last_name, email, role, zip, community, county, state, country, location, birth_month, birth_day, birth_year)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'resident'),
    new.raw_user_meta_data->>'zip',
    new.raw_user_meta_data->>'community',
    new.raw_user_meta_data->>'county',
    COALESCE(new.raw_user_meta_data->>'state', 'Texas'),
    COALESCE(new.raw_user_meta_data->>'country', 'USA'),
    COALESCE(new.raw_user_meta_data->>'location', 'Visitor'),
    (new.raw_user_meta_data->>'birth_month')::INT,
    (new.raw_user_meta_data->>'birth_day')::INT,
    (new.raw_user_meta_data->>'birth_year')::INT
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_requested TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 3. SOCIAL ENVIRONMENT
--------------------------------------------------------------------------------
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'post' CHECK (type IN ('post', 'news', 'poll', 'event', 'prayer_request', 'bible_verse', 'announcement', 'sale', 'repost')),
  content TEXT NOT NULL,
  location TEXT,
  media_urls TEXT[] DEFAULT '{}',
  poll_data JSONB DEFAULT NULL,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  upvote_count INT DEFAULT 0,
  downvote_count INT DEFAULT 0,
  repost_count INT DEFAULT 0,
  views INT DEFAULT 0,
  hot_score FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, profile_id)
);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- SOCIAL GRAPH
CREATE TABLE public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  rules TEXT,
  category TEXT CHECK (category IN ('Faith', 'Recipes', 'Events', 'Hobbies', 'General', 'Community', 'Business', 'Sports')),
  creator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, profile_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 4. MARKET ENVIRONMENT
--------------------------------------------------------------------------------
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'physical' CHECK (type IN ('physical', 'online', 'all')),
  category TEXT DEFAULT 'retail' CHECK (category IN ('artisan', 'food', 'services', 'retail', 'entertainment')),
  location TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  image_urls TEXT[] DEFAULT '{}',
  stock_status TEXT DEFAULT 'in_stock',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 5. ADS
--------------------------------------------------------------------------------
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  target_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 6. SECURITY POLICIES (RLS)
--------------------------------------------------------------------------------

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Posts
CREATE POLICY "Public posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "Admins can manage anything" ON public.posts FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Likes
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON public.likes FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- Comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can manage own comments" ON public.comments FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- Stores/Products
CREATE POLICY "Stores are viewable by everyone" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Owners can manage own stores" ON public.stores FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owners can manage own products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
);

-- Ads
CREATE POLICY "Active ads are viewable by everyone" ON public.ads FOR SELECT USING (status = 'active');
CREATE POLICY "Users can manage own ads" ON public.ads FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Admins can manage all ads" ON public.ads FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

--------------------------------------------------------------------------------
-- 7. UTILITIES
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_post_comments(post_id_val UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = post_id_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
