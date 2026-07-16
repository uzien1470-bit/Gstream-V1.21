-- ============================================================
-- Gstream v1.2 — User Profile Images migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- SAFE for production: idempotent. Does NOT drop or recreate anything.
-- Preserves all existing users and data.
--
-- Ensures the User table has an avatarUrl column for profile images.
-- (The column was already created in the original schema.sql, but this
-- migration guarantees it exists even if the original schema was run
-- before this feature was added.)
-- ============================================================

-- Add avatarUrl column if it doesn't exist (idempotent)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'User' and column_name = 'avatarUrl' and table_schema = 'public'
  ) then
    alter table public."User" add column "avatarUrl" text;
  end if;
end $$;

-- The RLS policies on User already allow self-update (users_self_update),
-- and the admin uses the service-role client which bypasses RLS, so no
-- additional RLS changes are needed for the avatarUrl column.

-- ============================================================
-- Migration complete. Admins can now set avatarUrl via the admin panel.
-- ============================================================
