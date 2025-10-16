-- Supabase Schema for CollabCanvas
-- Run in Supabase SQL Editor. Ensure Realtime is enabled for public.objects.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  status text check (status in ('online','away','busy')) default 'online',
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.canvases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.canvas_members (
  canvas_id uuid references public.canvases(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner','editor','viewer')) default 'editor',
  primary key (canvas_id, user_id)
);

create table if not exists public.objects (
  id uuid primary key default gen_random_uuid(),
  canvas_id uuid references public.canvases(id) on delete cascade,
  type text check (type in ('rect','circle','text')) not null,
  x numeric not null,
  y numeric not null,
  width numeric,
  height numeric,
  rotation numeric default 0,
  fill text,
  stroke text,
  text_content text,
  z_index int default 0,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.canvases enable row level security;
alter table public.canvas_members enable row level security;
alter table public.objects enable row level security;

create policy profiles_select on public.profiles for select using (true);
create policy profiles_upsert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id);

create policy canvases_insert on public.canvases for insert with check (auth.role() = 'authenticated');
create policy canvases_member_select on public.canvases for select using (
  exists (select 1 from public.canvas_members m where m.canvas_id = id and m.user_id = auth.uid())
);
create policy canvases_member_update on public.canvases for update using (
  exists (select 1 from public.canvas_members m where m.canvas_id = id and m.user_id = auth.uid())
);

create policy canvas_members_read on public.canvas_members for select using (user_id = auth.uid());
create policy canvas_members_join on public.canvas_members for insert with check (user_id = auth.uid());

create policy objects_member_select on public.objects for select using (
  exists (
    select 1 from public.canvas_members m
    where m.canvas_id = objects.canvas_id and m.user_id = auth.uid()
  )
);
create policy objects_member_mutate on public.objects for all using (
  exists (
    select 1 from public.canvas_members m
    where m.canvas_id = objects.canvas_id and m.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.canvas_members m
    where m.canvas_id = objects.canvas_id and m.user_id = auth.uid()
  )
);

-- Storage bucket for avatars
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies for avatars
create policy "Avatar images are publicly accessible"
on storage.objects for select
using ( bucket_id = 'avatars' );

create policy "Authenticated users can upload avatars"
on storage.objects for insert
with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Users can update their own avatars"
on storage.objects for update
using ( bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can delete their own avatars"
on storage.objects for delete
using ( bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1] );

