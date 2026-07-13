-- ============================================================
-- Gstream — Complete Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- Creates: all tables, junction tables, constraints, RLS policies,
-- storage buckets, auth→profile trigger.
-- ============================================================

-- ───────────────────────────── Extensions ─────────────────────────────
create extension if not exists "pgcrypto";

-- ───────────────────────────── User profile ─────────────────────────────
-- Mirrors auth.users. The `id` matches auth.users(id) (UUID).
-- A trigger (below) auto-inserts a row whenever a user signs up.

create table if not exists "User" (
  "id"         text primary key references auth.users(id) on delete cascade,
  "email"      text not null unique,
  "name"       text,
  "avatarUrl"  text,
  "role"       text not null default 'user',
  "status"     text not null default 'active',
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now()
);
create index if not exists "User_role_idx" on "User"("role");
create index if not exists "User_status_idx" on "User"("status");

-- ───────────────────────────── Taxonomy ─────────────────────────────
create table if not exists "Genre" (
  "id"        text primary key default gen_random_uuid()::text,
  "name"      text not null unique,
  "slug"      text not null unique,
  "createdAt" timestamptz not null default now()
);

create table if not exists "Category" (
  "id"        text primary key default gen_random_uuid()::text,
  "name"      text not null unique,
  "slug"      text not null unique,
  "icon"      text,
  "createdAt" timestamptz not null default now()
);

-- ───────────────────────────── Streaming servers ─────────────────────────────
create table if not exists "StreamingServer" (
  "id"        text primary key default gen_random_uuid()::text,
  "name"      text not null unique,
  "slug"      text not null unique,
  "priority"  int not null default 0,
  "status"    text not null default 'active',
  "createdAt" timestamptz not null default now()
);

-- ───────────────────────────── Movies ─────────────────────────────
create table if not exists "Movie" (
  "id"              text primary key default gen_random_uuid()::text,
  "title"           text not null,
  "slug"            text not null unique,
  "synopsis"        text not null default '',
  "posterUrl"       text not null default '',
  "backdropUrl"     text not null default '',
  "logoUrl"         text,
  "releaseYear"     int not null,
  "runtime"         int not null default 0,
  "rating"          double precision not null default 0,
  "voteCount"       int not null default 0,
  "trailerUrl"      text,
  "type"            text not null default 'movie',
  "featured"        boolean not null default false,
  "trending"        boolean not null default false,
  "popular"         boolean not null default false,
  "topRated"        boolean not null default false,
  "recentlyAdded"   boolean not null default true,
  "recentlyUpdated" boolean not null default true,
  "status"          text not null default 'published',
  "cast"            text not null default '[]',
  "createdAt"       timestamptz not null default now(),
  "updatedAt"       timestamptz not null default now()
);
create index if not exists "Movie_trending_idx" on "Movie"("trending");
create index if not exists "Movie_popular_idx" on "Movie"("popular");
create index if not exists "Movie_topRated_idx" on "Movie"("topRated");
create index if not exists "Movie_recentlyAdded_idx" on "Movie"("recentlyAdded");
create index if not exists "Movie_featured_idx" on "Movie"("featured");
create index if not exists "Movie_status_idx" on "Movie"("status");

create table if not exists "MovieServer" (
  "id"        text primary key default gen_random_uuid()::text,
  "movieId"   text not null references "Movie"("id") on delete cascade,
  "serverId"  text not null references "StreamingServer"("id") on delete cascade,
  "embedUrl"  text not null,
  "quality"   text not null default 'Auto',
  "priority"  int not null default 0,
  "status"    text not null default 'active',
  "createdAt" timestamptz not null default now()
);
create index if not exists "MovieServer_movieId_idx" on "MovieServer"("movieId");
create index if not exists "MovieServer_serverId_idx" on "MovieServer"("serverId");

-- ───────────────────────────── Series & Anime ─────────────────────────────
create table if not exists "Series" (
  "id"              text primary key default gen_random_uuid()::text,
  "title"           text not null,
  "slug"            text not null unique,
  "synopsis"        text not null default '',
  "posterUrl"       text not null default '',
  "backdropUrl"     text not null default '',
  "logoUrl"         text,
  "releaseYear"     int not null,
  "rating"          double precision not null default 0,
  "voteCount"       int not null default 0,
  "trailerUrl"      text,
  "type"            text not null default 'series',
  "featured"        boolean not null default false,
  "trending"        boolean not null default false,
  "popular"         boolean not null default false,
  "topRated"        boolean not null default false,
  "recentlyAdded"   boolean not null default true,
  "recentlyUpdated" boolean not null default true,
  "status"          text not null default 'published',
  "cast"            text not null default '[]',
  "createdAt"       timestamptz not null default now(),
  "updatedAt"       timestamptz not null default now()
);
create index if not exists "Series_type_idx" on "Series"("type");
create index if not exists "Series_trending_idx" on "Series"("trending");
create index if not exists "Series_popular_idx" on "Series"("popular");
create index if not exists "Series_topRated_idx" on "Series"("topRated");
create index if not exists "Series_recentlyAdded_idx" on "Series"("recentlyAdded");
create index if not exists "Series_featured_idx" on "Series"("featured");
create index if not exists "Series_status_idx" on "Series"("status");

create table if not exists "Season" (
  "id"           text primary key default gen_random_uuid()::text,
  "seriesId"     text not null references "Series"("id") on delete cascade,
  "seasonNumber" int not null,
  "title"        text not null,
  "description"  text,
  "posterUrl"    text,
  "episodeCount" int not null default 0,
  "createdAt"    timestamptz not null default now()
);
create index if not exists "Season_seriesId_idx" on "Season"("seriesId");

create table if not exists "Episode" (
  "id"            text primary key default gen_random_uuid()::text,
  "seasonId"      text not null references "Season"("id") on delete cascade,
  "episodeNumber" int not null,
  "title"         text not null,
  "description"   text,
  "thumbnailUrl"  text,
  "runtime"       int not null default 0,
  "airDate"       text,
  "createdAt"     timestamptz not null default now()
);
create index if not exists "Episode_seasonId_idx" on "Episode"("seasonId");

create table if not exists "EpisodeServer" (
  "id"        text primary key default gen_random_uuid()::text,
  "episodeId" text not null references "Episode"("id") on delete cascade,
  "serverId"  text not null references "StreamingServer"("id") on delete cascade,
  "embedUrl"  text not null,
  "quality"   text not null default 'Auto',
  "priority"  int not null default 0,
  "status"    text not null default 'active',
  "createdAt" timestamptz not null default now()
);
create index if not exists "EpisodeServer_episodeId_idx" on "EpisodeServer"("episodeId");
create index if not exists "EpisodeServer_serverId_idx" on "EpisodeServer"("serverId");

-- ───────────────────────────── Featured banners ─────────────────────────────
create table if not exists "FeaturedBanner" (
  "id"          text primary key default gen_random_uuid()::text,
  "title"       text not null,
  "description" text not null default '',
  "imageUrl"    text not null,
  "logoUrl"     text,
  "order"       int not null default 0,
  "active"      boolean not null default true,
  "movieId"     text references "Movie"("id") on delete cascade,
  "seriesId"    text references "Series"("id") on delete cascade,
  "createdAt"   timestamptz not null default now()
);
create index if not exists "FeaturedBanner_active_idx" on "FeaturedBanner"("active");
create index if not exists "FeaturedBanner_order_idx" on "FeaturedBanner"("order");

-- ───────────────────────────── User activity ─────────────────────────────
create table if not exists "MyList" (
  "id"          text primary key default gen_random_uuid()::text,
  "userId"      text not null references "User"("id") on delete cascade,
  "movieId"     text references "Movie"("id") on delete cascade,
  "seriesId"    text references "Series"("id") on delete cascade,
  "contentType" text not null,
  "createdAt"   timestamptz not null default now(),
  unique ("userId", "movieId", "seriesId")
);
create index if not exists "MyList_userId_idx" on "MyList"("userId");

create table if not exists "WatchHistory" (
  "id"          text primary key default gen_random_uuid()::text,
  "userId"      text not null references "User"("id") on delete cascade,
  "movieId"     text references "Movie"("id") on delete cascade,
  "seriesId"    text references "Series"("id") on delete cascade,
  "episodeId"   text references "Episode"("id") on delete cascade,
  "contentType" text not null,
  "watchedAt"   timestamptz not null default now()
);
create index if not exists "WatchHistory_userId_idx" on "WatchHistory"("userId");
create index if not exists "WatchHistory_watchedAt_idx" on "WatchHistory"("watchedAt");

create table if not exists "WatchProgress" (
  "id"          text primary key default gen_random_uuid()::text,
  "userId"      text not null references "User"("id") on delete cascade,
  "movieId"     text references "Movie"("id") on delete cascade,
  "seriesId"    text references "Series"("id") on delete cascade,
  "episodeId"   text references "Episode"("id") on delete cascade,
  "contentType" text not null,
  "progress"    double precision not null default 0,
  "duration"    int not null default 0,
  "position"    int not null default 0,
  "updatedAt"   timestamptz not null default now(),
  "createdAt"   timestamptz not null default now(),
  unique ("userId", "movieId", "seriesId", "episodeId")
);
create index if not exists "WatchProgress_userId_idx" on "WatchProgress"("userId");

-- ───────────────────────────── Junction tables (M2M) ─────────────────────────────
-- Named to match PostgREST relationship hints used in the app:
--   Genre!Movie_genres / Genre!Series_genres etc.

create table if not exists "Movie_genres" (
  "movieId" text not null references "Movie"("id") on delete cascade,
  "genreId" text not null references "Genre"("id") on delete cascade,
  primary key ("movieId", "genreId")
);
create table if not exists "Movie_categories" (
  "movieId"    text not null references "Movie"("id") on delete cascade,
  "categoryId" text not null references "Category"("id") on delete cascade,
  primary key ("movieId", "categoryId")
);
create table if not exists "Series_genres" (
  "seriesId" text not null references "Series"("id") on delete cascade,
  "genreId"  text not null references "Genre"("id") on delete cascade,
  primary key ("seriesId", "genreId")
);
create table if not exists "Series_categories" (
  "seriesId"   text not null references "Series"("id") on delete cascade,
  "categoryId" text not null references "Category"("id") on delete cascade,
  primary key ("seriesId", "categoryId")
);

-- ───────────────────────────── updated_at triggers ─────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new."updatedAt" = now(); return new; end; $$;

drop trigger if exists "User_touch" on public."User";
create trigger "User_touch" before update on public."User"
  for each row execute procedure public.touch_updated_at();
drop trigger if exists "Movie_touch" on public."Movie";
create trigger "Movie_touch" before update on public."Movie"
  for each row execute procedure public.touch_updated_at();
drop trigger if exists "Series_touch" on public."Series";
create trigger "Series_touch" before update on public."Series"
  for each row execute procedure public.touch_updated_at();
drop trigger if exists "WatchProgress_touch" on public."WatchProgress";
create trigger "WatchProgress_touch" before update on public."WatchProgress"
  for each row execute procedure public.touch_updated_at();

-- ───────────────────────────── Auth → Profile trigger ─────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public."User" (id, email, name, role, status)
  values (
    new.id::text,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ───────────────────────────── Storage buckets ─────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('posters', 'posters', true),
  ('backdrops', 'backdrops', true),
  ('avatars', 'avatars', true),
  ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

-- Posters (public read, admin write)
create policy "posters_public_read" on storage.objects for select using (bucket_id = 'posters');
create policy "posters_admin_write" on storage.objects for insert
  with check (bucket_id = 'posters' and exists (
    select 1 from public."User" u where u.id = auth.uid()::text and u.role = 'admin'
  ));
create policy "posters_admin_delete" on storage.objects for delete
  using (bucket_id = 'posters' and exists (
    select 1 from public."User" u where u.id = auth.uid()::text and u.role = 'admin'
  ));

-- Backdrops (public read, admin write)
create policy "backdrops_public_read" on storage.objects for select using (bucket_id = 'backdrops');
create policy "backdrops_admin_write" on storage.objects for insert
  with check (bucket_id = 'backdrops' and exists (
    select 1 from public."User" u where u.id = auth.uid()::text and u.role = 'admin'
  ));
create policy "backdrops_admin_delete" on storage.objects for delete
  using (bucket_id = 'backdrops' and exists (
    select 1 from public."User" u where u.id = auth.uid()::text and u.role = 'admin'
  ));

-- Avatars (public read, owner write)
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_owner_write" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);
create policy "avatars_owner_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid() = owner);

-- Thumbnails (public read, admin write)
create policy "thumbnails_public_read" on storage.objects for select using (bucket_id = 'thumbnails');
create policy "thumbnails_admin_write" on storage.objects for insert
  with check (bucket_id = 'thumbnails' and exists (
    select 1 from public."User" u where u.id = auth.uid()::text and u.role = 'admin'
  ));
create policy "thumbnails_admin_delete" on storage.objects for delete
  using (bucket_id = 'thumbnails' and exists (
    select 1 from public."User" u where u.id = auth.uid()::text and u.role = 'admin'
  ));

-- ───────────────────────────── RLS on public tables ─────────────────────────────
alter table public."User" enable row level security;
create policy "users_self_read" on public."User" for select
  using (auth.uid()::text = id or exists (
    select 1 from public."User" u where u.id = auth.uid()::text and u.role = 'admin'
  ));
create policy "users_self_update" on public."User" for update
  using (auth.uid()::text = id);

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

-- Junction tables (public read — they only contain IDs)
alter table public."Movie_genres" enable row level security;
create policy "movie_genres_read" on public."Movie_genres" for select using (true);
alter table public."Movie_categories" enable row level security;
create policy "movie_categories_read" on public."Movie_categories" for select using (true);
alter table public."Series_genres" enable row level security;
create policy "series_genres_read" on public."Series_genres" for select using (true);
alter table public."Series_categories" enable row level security;
create policy "series_categories_read" on public."Series_categories" for select using (true);

-- User activity (owner-only; service role bypasses RLS)
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
-- After registering your first user, promote to admin:
--   update public."User" set role = 'admin' where email = 'you@example.com';
-- ============================================================
