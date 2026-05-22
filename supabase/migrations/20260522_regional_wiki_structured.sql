-- wiki_profiles
create table public.wiki_profiles (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  birth_date date,
  death_date date,
  bio_summary text,
  era text,
  external_links jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  embedding vector(384),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- wiki_events
create table public.wiki_events (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  event_date date,
  description text,
  location_coords text,
  impact_rating integer,
  embedding vector(384),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- wiki_statistics
create table public.wiki_statistics (
  id uuid default gen_random_uuid() primary key,
  county text not null,
  year integer not null,
  data_type text not null,
  metrics jsonb default '{}'::jsonb,
  source_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- indexes
create index on public.wiki_profiles using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on public.wiki_events using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on public.wiki_statistics (county, year, data_type);

-- RLS
alter table public.wiki_profiles enable row level security;
alter table public.wiki_events enable row level security;
alter table public.wiki_statistics enable row level security;

create policy "wiki_profiles viewable by everyone" on public.wiki_profiles for select using (true);
create policy "wiki_events viewable by everyone" on public.wiki_events for select using (true);
create policy "wiki_statistics viewable by everyone" on public.wiki_statistics for select using (true);

-- Update match_universal
create or replace function public.match_universal(
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id text,
  type text,
  title text,
  description text,
  image_url text,
  similarity float
)
language sql stable
as $$
  select * from (
    select p.id::text, 'profile' as type, p.first_name || ' ' || p.last_name as title, p.bio as description, p.avatar_url as image_url, 1 - (p.embedding <=> query_embedding) as similarity
    from public.profiles p where p.embedding is not null and 1 - (p.embedding <=> query_embedding) > match_threshold
    union all
    select po.id::text, 'post' as type, substring(po.content from 1 for 50) || '...' as title, po.content as description, null as image_url, 1 - (po.embedding <=> query_embedding) as similarity
    from public.posts po where po.embedding is not null and 1 - (po.embedding <=> query_embedding) > match_threshold
    union all
    select s.id::text, 'store' as type, s.name as title, s.description as description, s.logo_url as image_url, 1 - (s.embedding <=> query_embedding) as similarity
    from public.stores s where s.embedding is not null and 1 - (s.embedding <=> query_embedding) > match_threshold
    union all
    select e.id::text, 'event' as type, e.title as title, e.description as description, e.image_url as image_url, 1 - (e.embedding::vector(384) <=> query_embedding) as similarity
    from public.events e where e.embedding is not null and 1 - (e.embedding::vector(384) <=> query_embedding) > match_threshold
    union all
    select w.id::text, 'wiki' as type, w.title as title, w.description as description, w.url as image_url, 1 - (w.embedding <=> query_embedding) as similarity
    from public.search_wiki_entries w where w.embedding is not null and 1 - (w.embedding <=> query_embedding) > match_threshold
    union all
    select wp.id::text, 'wiki_profile' as type, wp.name as title, wp.bio_summary as description, null as image_url, 1 - (wp.embedding <=> query_embedding) as similarity
    from public.wiki_profiles wp where wp.embedding is not null and 1 - (wp.embedding <=> query_embedding) > match_threshold
    union all
    select we.id::text, 'wiki_event' as type, we.title as title, we.description as description, null as image_url, 1 - (we.embedding <=> query_embedding) as similarity
    from public.wiki_events we where we.embedding is not null and 1 - (we.embedding <=> query_embedding) > match_threshold
  ) combined
  order by combined.similarity desc
  limit match_count;
$$;
