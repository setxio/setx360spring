-- 1. Create wiki_articles table
create table public.wiki_articles (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  category text not null check (category in ('figure', 'artist', 'sports', 'event', 'business')),
  body_content text not null,
  infobox_data jsonb default '{}'::jsonb,
  external_links jsonb default '[]'::jsonb,
  community_notes jsonb default '[]'::jsonb,
  embedding vector(384),
  author_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create index for semantic vector search
create index on public.wiki_articles using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 3. Migrate existing data from wiki_profiles and wiki_events
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'wiki_profiles') then
    insert into public.wiki_articles (slug, title, category, body_content, infobox_data, external_links, embedding, created_at)
    select 
      slug, 
      name as title,
      case 
        when metadata->>'profession' = 'athlete' or metadata->'sports' is not null then 'sports'::text
        when metadata->>'profession' = 'musician' or metadata->>'profession' = 'artist' or metadata->'genres' is not null then 'artist'::text
        else 'figure'::text
      end as category,
      bio_summary as body_content,
      jsonb_build_object(
        'birth_date', birth_date,
        'death_date', death_date,
        'era', era,
        'profession', metadata->>'profession',
        'genres', metadata->'genres',
        'sports', metadata->'sports'
      ) || coalesce(metadata, '{}'::jsonb) as infobox_data,
      external_links,
      embedding,
      created_at
    from public.wiki_profiles
    on conflict (slug) do nothing;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'wiki_events') then
    insert into public.wiki_articles (slug, title, category, body_content, infobox_data, external_links, embedding, created_at)
    select 
      slug, 
      title,
      'event'::text as category,
      description as body_content,
      jsonb_build_object(
        'event_date', event_date,
        'location_coords', location_coords,
        'impact_rating', impact_rating
      ) as infobox_data,
      '[]'::jsonb as external_links,
      embedding,
      created_at
    from public.wiki_events
    on conflict (slug) do nothing;
  end if;
end $$;

-- 4. Drop the old tables
drop table if exists public.wiki_profiles cascade;
drop table if exists public.wiki_events cascade;

-- 5. Create wiki_edits moderation table
create table public.wiki_edits (
  id uuid default gen_random_uuid() primary key,
  article_id uuid references public.wiki_articles(id) on delete set null,
  proposed_by uuid references auth.users(id) on delete set null,
  category text not null check (category in ('figure', 'artist', 'sports', 'event', 'business')),
  title text not null,
  slug text not null,
  body_content text not null,
  infobox_data jsonb default '{}'::jsonb,
  external_links jsonb default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Update match_universal function to include the unified wiki_articles table
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
    select wa.id::text, 'wiki_article' as type, wa.title as title, substring(wa.body_content from 1 for 150) as description, (wa.infobox_data->>'image_url') as image_url, 1 - (wa.embedding <=> query_embedding) as similarity
    from public.wiki_articles wa where wa.embedding is not null and 1 - (wa.embedding <=> query_embedding) > match_threshold
  ) combined
  order by combined.similarity desc
  limit match_count;
$$;

-- 7. Row Level Security Configuration
alter table public.wiki_articles enable row level security;
alter table public.wiki_edits enable row level security;

-- Policies for wiki_articles
create policy "wiki_articles viewable by everyone" on public.wiki_articles for select using (true);
create policy "wiki_articles editable by admins" on public.wiki_articles for all 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Policies for wiki_edits
create policy "wiki_edits viewable by everyone" on public.wiki_edits for select using (true);
create policy "wiki_edits insertable by authenticated" on public.wiki_edits for insert 
  with check (auth.uid() is not null);
create policy "wiki_edits manageable by admins" on public.wiki_edits for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
