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
  type text check (type in ('rect','circle','text','frame','line')) not null,
  x numeric not null,
  y numeric not null,
  width numeric,
  height numeric,
  rotation numeric default 0,
  fill text,
  stroke text,
  stroke_width numeric,
  text_content text,
  points jsonb,
  z_index int default 0,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  -- Version for optimistic concurrency control
  version int not null default 1
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

-- =========================================================
-- Concurrency and RPCs for objects
-- =========================================================

-- Ensure updated_at is set on every UPDATE
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_timestamp_objects'
  ) then
    create trigger set_timestamp_objects
    before update on public.objects
    for each row execute procedure public.trigger_set_timestamp();
  end if;
end$$;

-- Bump version and set updated_by on every UPDATE
create or replace function public.trigger_bump_version()
returns trigger as $$
begin
  new.version = old.version + 1;
  if new.updated_by is null then
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'bump_version_objects'
  ) then
    create trigger bump_version_objects
    before update on public.objects
    for each row execute procedure public.trigger_bump_version();
  end if;
end$$;

-- Optimistic single-object update: only update if version matches
create or replace function public.rpc_update_object_if_unmodified(
  p_id uuid,
  p_expected_version int,
  p_patch jsonb
)
returns setof public.objects
language plpgsql
security definer
as $$
begin
  return query
  update public.objects o
  set x = coalesce((p_patch->>'x')::numeric, o.x),
      y = coalesce((p_patch->>'y')::numeric, o.y),
      width = coalesce((p_patch->>'width')::numeric, o.width),
      height = coalesce((p_patch->>'height')::numeric, o.height),
      rotation = coalesce((p_patch->>'rotation')::numeric, o.rotation),
      fill = coalesce(p_patch->>'fill', o.fill),
      text_content = coalesce(p_patch->>'text_content', o.text_content)
  where o.id = p_id and o.version = p_expected_version
  returning *;
end;
$$;

-- Atomic batch position updates for multi-select drag/align
create or replace function public.rpc_update_many_positions(
  p_updates jsonb
)
returns setof public.objects
language plpgsql
security definer
as $$
begin
  return query
  with u as (
    select (x->>'id')::uuid as id,
           (x->>'expected_version')::int as expected_version,
           (x->>'x')::numeric as x,
           (x->>'y')::numeric as y
    from jsonb_array_elements(p_updates) as x
  )
  update public.objects o
  set x = coalesce(u.x, o.x),
      y = coalesce(u.y, o.y)
  from u
  where o.id = u.id and o.version = u.expected_version
  returning o.*;
end;
$$;

