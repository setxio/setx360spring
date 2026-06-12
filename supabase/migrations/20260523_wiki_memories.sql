-- Create wiki_memories table
create table if not exists public.wiki_memories (
  id uuid default gen_random_uuid() primary key,
  article_id uuid references public.wiki_articles(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  memory_text text not null,
  media_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.wiki_memories enable row level security;

-- Policies for wiki_memories
drop policy if exists "wiki_memories viewable by everyone" on public.wiki_memories;
create policy "wiki_memories viewable by everyone" on public.wiki_memories
  for select using (true);

drop policy if exists "wiki_memories insertable by authenticated users" on public.wiki_memories;
create policy "wiki_memories insertable by authenticated users" on public.wiki_memories
  for insert with check (auth.uid() = profile_id);

drop policy if exists "wiki_memories editable by owners" on public.wiki_memories;
create policy "wiki_memories editable by owners" on public.wiki_memories
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists "wiki_memories deletable by owners or admins" on public.wiki_memories;
create policy "wiki_memories deletable by owners or admins" on public.wiki_memories
  for delete using (
    auth.uid() = profile_id OR 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Indexes
create index if not exists wiki_memories_article_id_idx on public.wiki_memories(article_id);
create index if not exists wiki_memories_profile_id_idx on public.wiki_memories(profile_id);

-- Provision wiki-media storage bucket
insert into storage.buckets (id, name, public)
values ('wiki-media', 'wiki-media', true)
on conflict (id) do nothing;

-- RLS policies for storage bucket objects
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Wiki Media Viewable by Anyone'
  ) then
    create policy "Wiki Media Viewable by Anyone" on storage.objects 
      for select using (bucket_id = 'wiki-media');
  end if;
  
  if not exists (
    select 1 from pg_policies where policyname = 'Wiki Media Uploadable by Authenticated Users'
  ) then
    create policy "Wiki Media Uploadable by Authenticated Users" on storage.objects 
      for insert with check (bucket_id = 'wiki-media' and auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where policyname = 'Wiki Media Deletable by Owner or Admin'
  ) then
    create policy "Wiki Media Deletable by Owner or Admin" on storage.objects 
      for delete using (
        bucket_id = 'wiki-media' and 
        (auth.uid()::text = owner::text OR exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
      );
  end if;
end $$;
