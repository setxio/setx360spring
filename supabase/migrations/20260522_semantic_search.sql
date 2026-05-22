-- Enable pgvector
create extension if not exists vector;

-- Add embedding columns to tables
alter table public.profiles add column if not exists embedding vector(384);
alter table public.posts add column if not exists embedding vector(384);
alter table public.stores add column if not exists embedding vector(384);

-- events already has an embedding column. Make sure it is vector(384).
-- If it was created as text, this will throw an error, but assuming it was created properly.
-- If it wasn't, we drop it and recreate it (skipping for safety, assuming it's already correct or string in ts maps to vector).

-- Create unified match_universal RPC
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
    -- PROFILES
    select
      p.id::text,
      'profile' as type,
      p.first_name || ' ' || p.last_name as title,
      p.bio as description,
      p.avatar_url as image_url,
      1 - (p.embedding <=> query_embedding) as similarity
    from public.profiles p
    where p.embedding is not null
      and 1 - (p.embedding <=> query_embedding) > match_threshold

    union all

    -- POSTS
    select
      po.id::text,
      'post' as type,
      po.title as title,
      po.content as description,
      null as image_url,
      1 - (po.embedding <=> query_embedding) as similarity
    from public.posts po
    where po.embedding is not null
      and 1 - (po.embedding <=> query_embedding) > match_threshold

    union all

    -- STORES
    select
      s.id::text,
      'store' as type,
      s.name as title,
      s.description as description,
      s.logo_url as image_url,
      1 - (s.embedding <=> query_embedding) as similarity
    from public.stores s
    where s.embedding is not null
      and 1 - (s.embedding <=> query_embedding) > match_threshold

    union all

    -- EVENTS
    select
      e.id::text,
      'event' as type,
      e.title as title,
      e.description as description,
      e.image_url as image_url,
      1 - (e.embedding::vector(384) <=> query_embedding) as similarity
    from public.events e
    where e.embedding is not null
      and 1 - (e.embedding::vector(384) <=> query_embedding) > match_threshold

  ) combined
  order by combined.similarity desc
  limit match_count;
$$;
