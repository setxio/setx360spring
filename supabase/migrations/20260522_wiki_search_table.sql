create table public.search_wiki_entries (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  content text,
  url text,
  type text default 'general',
  embedding vector(384),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.search_wiki_entries enable row level security;

create policy "Wiki entries are viewable by everyone" on public.search_wiki_entries for select using (true);

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
  ) combined
  order by combined.similarity desc
  limit match_count;
$$;
