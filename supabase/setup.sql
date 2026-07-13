-- ============================================================
-- Gstream — Supabase setup script
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)
-- after creating your Supabase project.
--
-- This script:
--   1. Creates storage buckets (posters, backdrops, avatars, uploads)
--   2. Creates a trigger that auto-inserts a profile row in public."User"
--      whenever a new user signs up via Supabase Auth
--   3. Sets Row Level Security policies
--   4. Promotes the first configured user to admin (run the command at
--      the bottom AFTER you have created your admin account via the app)
-- ============================================================

-- ───────────────────────────── 1. Storage buckets ─────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('posters', 'posters', true),
  ('backdrops', 'backdrops', true),
  ('avatars', 'avatars', true),
  ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Posters (public read, admin write)
create policy "posters_public_read" on storage.objects for select using (bucket_id = 'posters');
create policy "posters_admin_write" on storage.objects for insert
  with check (
    bucket_id = 'posters'
    and exists (select 1 from public."User" u where u.id = auth.uid()::text and u.role = 'admin')
  );
create policy "posters_admin_delete" on storage.objects for delete
  using (
    bucket_id = 'posters'
    and exists (select 1 from public."User" u where u.id = auth.uid()::text and u.role = 'admin')
  );

-- Backdrops (public read, admin write)
create policy "backdrops_public_read" on storage.objects for select using (bucket_id = 'backdrops');
create policy "backdrops_admin_write" on storage.objects for insert
  with check (
    bucket_id = 'backdrops'
    and exists (select 1 from public."User" u where u.id = auth.uid()::text and u.role = 'admin')
  );
create policy "backdrops_admin_delete" on storage.objects for delete
  using (
    bucket_id = 'backdrops'
    and exists (select 1 from public."User" u where u.id = auth.uid()::text and u.role = 'admin')
  );

-- Avatars (public read, owner write)
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_owner_write" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);
create policy "avatars_owner_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid() = owner);

-- Uploads (authenticated read/write)
create policy "uploads_authenticated_read" on storage.objects for select
  using (bucket_id = 'uploads' and auth.uid() is not null);
create policy "uploads_authenticated_write" on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.uid() is not null);

-- ───────────────────────────── 2. Auth → Profile trigger ─────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public."User" (id, email, name, "role", status)
  values (
    new.id::text,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ───────────────────────────── 3. RLS on public tables ─────────────────────────────
alter table public."User" enable row level security;
create policy "users_self_read" on public."User"
  for select using (auth.uid()::text = id or exists (
    select 1 from public."User" u where u.id = auth.uid()::text and u.role = 'admin'
  ));
create policy "users_self_update" on public."User"
  for update using (auth.uid()::text = id);

alter table public."Movie" enable row level security;
create policy "movies_public_read" on public."Movie" for select using (true);
alter table public."Series" enable row level security;
create policy "series_public_read" on public."Series" for select using (true);
alter table public."Season" enable row level security;
create policy "seasons_public_read" on public."Season" for select using (true);
alter table public."Episode" enable row level security;
create policy "episodes_public_read" on public."Episode" for select using (true);
alter table public."Genre" enable row level security;
create policy "genres_public_read" on public."Genre" for select using (true);
alter table public."Category" enable row level security;
create policy "categories_public_read" on public."Category" for select using (true);
alter table public."StreamingServer" enable row level security;
create policy "servers_public_read" on public."StreamingServer" for select using (true);
alter table public."MovieServer" enable row level security;
create policy "movieservers_public_read" on public."MovieServer" for select using (true);
alter table public."EpisodeServer" enable row level security;
create policy "episodeservers_public_read" on public."EpisodeServer" for select using (true);
alter table public."FeaturedBanner" enable row level security;
create policy "banners_public_read" on public."FeaturedBanner" for select using (true);

alter table public."MyList" enable row level security;
create policy "mylist_owner_read" on public."MyList" for select using (auth.uid()::text = "userId");
create policy "mylist_owner_write" on public."MyList" for all using (auth.uid()::text = "userId");
alter table public."WatchHistory" enable row level security;
create policy "history_owner_read" on public."WatchHistory" for select using (auth.uid()::text = "userId");
create policy "history_owner_write" on public."WatchHistory" for all using (auth.uid()::text = "userId");
alter table public."WatchProgress" enable row level security;
create policy "progress_owner_read" on public."WatchProgress" for select using (auth.uid()::text = "userId");
create policy "progress_owner_write" on public."WatchProgress" for all using (auth.uid()::text = "userId");

-- ============================================================
-- 4. PROMOTE YOUR ADMIN ACCOUNT
-- After registering your first user through the app, run:
--   update public."User" set role = 'admin' where email = 'you@example.com';
-- ============================================================
