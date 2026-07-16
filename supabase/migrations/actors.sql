-- ============================================================
-- Gstream — Actor Management System migration (v1.1)
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- SAFE for production: uses CREATE TABLE IF NOT EXISTS, DROP ... IF EXISTS.
-- Does NOT touch any existing table, data, or policy.
--
-- Creates:
--   1. Actor table (with profile/hero photos, biography, etc.)
--   2. MovieActor junction (movieId, actorId, characterName, displayOrder)
--   3. SeriesActor junction (seriesId, actorId, characterName, displayOrder)
--   4. RLS policies (public read, admin write via service role)
--   5. Data migration: converts existing JSON cast → Actor + junction rows
-- ============================================================

-- ───────────────────────────── Actor table ─────────────────────────────
create table if not exists "Actor" (
  "id"              text primary key default gen_random_uuid()::text,
  "name"            text not null,
  "slug"            text not null unique,
  "profilePhotoUrl" text,
  "heroPhotoUrl"    text,
  "biography"       text,
  "birthday"        text,
  "birthPlace"      text,
  "nationality"     text,
  "status"          text not null default 'published',
  "createdAt"       timestamptz not null default now(),
  "updatedAt"       timestamptz not null default now()
);
create index if not exists "Actor_slug_idx" on "Actor"("slug");
create index if not exists "Actor_status_idx" on "Actor"("status");

-- ───────────────────────────── MovieActor junction ─────────────────────────────
create table if not exists "MovieActor" (
  "movieId"        text not null references "Movie"("id") on delete cascade,
  "actorId"        text not null references "Actor"("id") on delete restrict,
  "characterName"  text,
  "displayOrder"   int not null default 0,
  "createdAt"      timestamptz not null default now(),
  primary key ("movieId", "actorId")
);
create index if not exists "MovieActor_movieId_idx" on "MovieActor"("movieId");
create index if not exists "MovieActor_actorId_idx" on "MovieActor"("actorId");

-- ───────────────────────────── SeriesActor junction ─────────────────────────────
-- Covers both "series" and "anime" types (they share the Series table)
create table if not exists "SeriesActor" (
  "seriesId"       text not null references "Series"("id") on delete cascade,
  "actorId"        text not null references "Actor"("id") on delete restrict,
  "characterName"  text,
  "displayOrder"   int not null default 0,
  "createdAt"      timestamptz not null default now(),
  primary key ("seriesId", "actorId")
);
create index if not exists "SeriesActor_seriesId_idx" on "SeriesActor"("seriesId");
create index if not exists "SeriesActor_actorId_idx" on "SeriesActor"("actorId");

-- ───────────────────────────── updated_at trigger ─────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new."updatedAt" = now(); return new; end; $$;

drop trigger if exists "Actor_touch" on public."Actor";
create trigger "Actor_touch" before update on public."Actor"
  for each row execute procedure public.touch_updated_at();

-- ───────────────────────────── RLS policies ─────────────────────────────
-- Public read (catalogue), admin writes via service-role client (bypasses RLS)
alter table public."Actor" enable row level security;
drop policy if exists "actors_public_read" on public."Actor";
create policy "actors_public_read" on public."Actor" for select using (true);

alter table public."MovieActor" enable row level security;
drop policy if exists "movieactors_public_read" on public."MovieActor";
create policy "movieactors_public_read" on public."MovieActor" for select using (true);

alter table public."SeriesActor" enable row level security;
drop policy if exists "seriesactors_public_read" on public."SeriesActor";
create policy "seriesactors_public_read" on public."SeriesActor" for select using (true);

-- ============================================================
-- DATA MIGRATION — convert existing JSON cast to relational Actors
-- Runs automatically. Safe to re-run (idempotent via ON CONFLICT).
-- ============================================================

-- Helper: normalize a name for slug matching
create or replace function public.actor_slug(n text)
returns text language plpgsql immutable as $$
begin
  return lower(regexp_replace(n, '[^a-zA-Z0-9]+', '-', 'g'));
end; $$;

-- 1. Insert unique Actors from every Movie.cast JSON
insert into "Actor" (name, slug, status)
select distinct
  trim((j->>'name')::text) as name,
  public.actor_slug(trim((j->>'name')::text)) as slug,
  'published'
from "Movie" m
cross join lateral json_array_elements(m."cast"::json) as j
where j->>'name' is not null and trim(j->>'name') <> ''
on conflict (slug) do nothing;

-- 2. Insert unique Actors from every Series.cast JSON (includes anime)
insert into "Actor" (name, slug, status)
select distinct
  trim((j->>'name')::text) as name,
  public.actor_slug(trim((j->>'name')::text)) as slug,
  'published'
from "Series" s
cross join lateral json_array_elements(s."cast"::json) as j
where j->>'name' is not null and trim(j->>'name') <> ''
on conflict (slug) do nothing;

-- 3. Create MovieActor relationships from Movie.cast JSON
-- NOTE: json_array_elements(...) WITH ORDINALITY returns a record (value, ord).
-- We alias as j(val, ord) and extract from j.val.
insert into "MovieActor" ("movieId", "actorId", "characterName", "displayOrder")
select
  m.id as "movieId",
  a.id as "actorId",
  j.val->>'role' as "characterName",
  j.ord - 1 as "displayOrder"
from "Movie" m
cross join lateral json_array_elements(m."cast"::json) with ordinality as j(val, ord)
join "Actor" a on a.slug = public.actor_slug(trim((j.val->>'name')::text))
where j.val->>'name' is not null and trim(j.val->>'name') <> ''
on conflict ("movieId", "actorId") do nothing;

-- 4. Create SeriesActor relationships from Series.cast JSON (includes anime)
insert into "SeriesActor" ("seriesId", "actorId", "characterName", "displayOrder")
select
  s.id as "seriesId",
  a.id as "actorId",
  j.val->>'role' as "characterName",
  j.ord - 1 as "displayOrder"
from "Series" s
cross join lateral json_array_elements(s."cast"::json) with ordinality as j(val, ord)
join "Actor" a on a.slug = public.actor_slug(trim((j.val->>'name')::text))
where j.val->>'name' is not null and trim(j.val->>'name') <> ''
on conflict ("seriesId", "actorId") do nothing;

-- ============================================================
-- Migration complete. Existing JSON cast columns are preserved
-- (the app will read from relational Actor tables going forward).
-- ============================================================
