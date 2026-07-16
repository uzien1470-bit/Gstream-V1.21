-- ============================================================
-- Gstream v1.2.1 — Avatar Library migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- SAFE for production: idempotent. Preserves all existing users and data.
--
-- Creates:
--   1. Avatar table (site-wide avatar library)
--   2. User.avatarId column (references Avatar)
--   3. RLS policy (public read for enabled avatars)
-- ============================================================

-- ───────────────────────────── Avatar table ─────────────────────────────
create table if not exists "Avatar" (
  "id"           text primary key default gen_random_uuid()::text,
  "name"         text not null,
  "imageUrl"     text not null,
  "displayOrder" int not null default 0,
  "enabled"      boolean not null default true,
  "createdAt"    timestamptz not null default now(),
  "updatedAt"    timestamptz not null default now()
);
create index if not exists "Avatar_displayOrder_idx" on "Avatar"("displayOrder");
create index if not exists "Avatar_enabled_idx" on "Avatar"("enabled");

-- ───────────────────────────── User.avatarId column ─────────────────────────────
-- Adds a nullable avatarId FK to User. Preserves the existing avatarUrl
-- column as a fallback (legacy users with avatarUrl still work).
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'User' and column_name = 'avatarId' and table_schema = 'public'
  ) then
    alter table public."User" add column "avatarId" text;
  end if;
end $$;

-- Add FK constraint if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'User_avatarId_fkey' and table_name = 'User' and table_schema = 'public'
  ) then
    alter table public."User"
    add constraint "User_avatarId_fkey"
    foreign key ("avatarId") references public."Avatar"("id") on delete set null;
  end if;
end $$;

create index if not exists "User_avatarId_idx" on "User"("avatarId");

-- ───────────────────────────── updated_at trigger ─────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new."updatedAt" = now(); return new; end; $$;

drop trigger if exists "Avatar_touch" on public."Avatar";
create trigger "Avatar_touch" before update on public."Avatar"
  for each row execute procedure public.touch_updated_at();

-- ───────────────────────────── RLS policies ─────────────────────────────
alter table public."Avatar" enable row level security;
drop policy if exists "avatars_public_read" on public."Avatar";
create policy "avatars_public_read" on public."Avatar" for select using (true);

-- ============================================================
-- Migration complete. Admin can now manage the avatar library.
-- ============================================================
