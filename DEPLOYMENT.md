# Gstream — Deployment Guide

Gstream is a premium OTT streaming platform built on **Next.js 16**, **Prisma ORM**, **Supabase** (PostgreSQL + Auth + Storage), and **Tailwind CSS**. This guide walks you through connecting your Supabase backend and deploying to Vercel.

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui |
| ORM | Prisma (PostgreSQL provider) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (via `@supabase/ssr` for cookie sessions) |
| Storage | Supabase Storage (posters, backdrops, avatars, uploads) |
| Hosting | Vercel |

**Database access stays on Prisma** — the app does NOT use `@supabase/supabase-js` for database queries. Supabase Auth handles authentication; a Supabase trigger auto-creates a profile row in the Prisma-managed `public."User"` table whenever a user signs up.

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Pick a name, set a strong database password, choose a region close to your users.
3. Wait ~2 minutes for provisioning to finish.
4. Collect your credentials from **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**keep secret, server-only**)
5. From **Project Settings → Database → Connection string** (Transaction/Session mode):
   - Copy the URI → `DATABASE_URL` and `DIRECT_URL`
   - Replace `[YOUR-PASSWORD]` with your database password.

---

## Step 2 — Configure environment variables

### Local development
```bash
cp .env.example .env.local
# Edit .env.local and fill in your Supabase credentials
```

### Vercel deployment
In your Vercel project → **Settings → Environment Variables**, add all 5 variables from `.env.example` for **Production**, **Preview**, and **Development**.

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` must NEVER be prefixed with `NEXT_PUBLIC_` — it bypasses RLS and is server-only.

---

## Step 3 — Create the database schema

Run Prisma against your Supabase Postgres:

```bash
bun run db:push
# or, to use migration files:
bun run db:migrate:dev --name init
```

This creates all tables (`Movie`, `Series`, `Season`, `Episode`, `Genre`, etc.) in your Supabase `public` schema.

---

## Step 4 — Run the Supabase setup SQL

Open `supabase/setup.sql` from this repo and paste it into the **Supabase SQL Editor** (Dashboard → SQL → New query), then click **Run**.

This script:
1. Creates storage buckets: `posters`, `backdrops`, `avatars`, `uploads`
2. Creates a trigger that auto-inserts a row in `public."User"` whenever someone signs up via Supabase Auth
3. Enables Row Level Security with policies (public read for catalogue, owner-only for user activity, admin-only for write operations)

---

## Step 5 — Seed content & create your admin

```bash
bun run db:seed
```

This seeds movies, TV series, anime, genres, categories, and streaming servers. It also creates two auth users via the Supabase admin API:
- `admin@gstream.com` / `admin123` (promoted to admin role)
- `user@gstream.com` / `user123`

> **Note:** seeding requires `SUPABASE_SERVICE_ROLE_KEY` to be set. If you'd rather create the admin yourself through the app UI, register at `/register`, then run this SQL in the Supabase SQL Editor:
> ```sql
> update public."User" set role = 'admin' where email = 'your-email@example.com';
> ```

The app enforces a **single-admin** rule — only one user can hold the admin role at a time.

---

## Step 6 — Deploy to Vercel

1. Push the project to a GitHub/GitLab/Bitbucket repository.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Vercel auto-detects Next.js — no build config needed.
4. Add the 5 environment variables (from Step 2) in **Settings → Environment Variables**.
5. Click **Deploy**.

Vercel will:
- Install dependencies (`bun install` / `npm install`)
- Build with `next build`
- Serve the app on a global CDN with edge functions for API routes

---

## Storage usage

Image uploads flow through Supabase Storage:

| Bucket | Public | Write access | Used for |
|---|---|---|---|
| `posters` | ✅ | Admin only | Movie/series poster uploads (admin panel) |
| `backdrops` | ✅ | Admin only | Movie/series backdrop uploads |
| `avatars` | ✅ | Owner (authenticated) | User profile avatars |
| `uploads` | ❌ | Authenticated | General-purpose uploads |

Upload endpoints:
- `POST /api/admin/upload` — admin uploads poster/backdrop (returns Supabase Storage public URL)
- `POST /api/profile/avatar` — user uploads their avatar (stored at `avatars/<userId>/avatar-<ts>.<ext>`)

External image URLs (TMDB, etc.) in seed data work as-is — Storage is used when admins upload new images through the dashboard.

---

## How auth works

1. **Register** (`/register`): calls `supabase.auth.signUp()` → Supabase creates `auth.users` row → trigger creates `public."User"` profile row.
2. **Login** (`/login`): calls `supabase.auth.signInWithPassword()` → `@supabase/ssr` sets the session cookie → `/api/auth/me` reads the Supabase user + Prisma profile.
3. **Protected routes**: API routes call `requireAuth()` / `requireAdmin()` (in `src/lib/auth.ts`) which read the Supabase session and fetch the Prisma profile.
4. **Logout**: `supabase.auth.signOut()` clears the cookie.
5. **Password reset**: `supabase.auth.resetPasswordForEmail()` sends a recovery link → user lands on `/reset-password` → `supabase.auth.updateUser({ password })`.

Profile fields managed by Prisma (`public."User"`): `role`, `status`, `name`, `avatarUrl`. Email/password are managed by Supabase Auth (`auth.users`).

---

## Local development without Supabase

If Supabase env vars are missing, the app shows a friendly **"Connect Supabase"** setup screen instead of crashing — so you can run `bun run dev` and the dev server stays up while you configure credentials.

---

## Project structure (key files)

```
prisma/
  schema.prisma            # PostgreSQL schema (Prisma)
  migrations/0_init/       # Generated Postgres migration SQL
  seed.ts                  # Seeds content + creates auth users
supabase/
  setup.sql                # Storage buckets + auth trigger + RLS policies
src/lib/
  db.ts                    # Prisma client
  auth.ts                  # Supabase Auth wrappers (requireAuth, requireAdmin)
  supabase/
    server.ts              # Server Supabase client (@supabase/ssr)
    client.ts              # Browser Supabase client (singleton)
    admin.ts               # Service-role client (server-only)
    configured.ts          # isSupabaseConfigured() env-var gate
.env.example               # All required environment variables
```

---

## Troubleshooting

**"Connect Supabase" screen won't go away**
→ Your env vars aren't loaded. Restart `bun run dev` after editing `.env.local`. On Vercel, redeploys pick up new env vars automatically.

**Prisma error: `Database connection error`**
→ Check `DATABASE_URL` is the full connection string with password, and that your IP isn't blocked by Supabase network restrictions (Dashboard → Settings → Database → Network Restrictions).

**Can't sign in after seeding**
→ Ensure `supabase/setup.sql` was run (it creates the auth trigger). Without it, the profile row isn't created on signup, and `/api/auth/me` returns null.

**Admin panel shows "Unauthorized"**
→ Your profile's `role` is still `user`. Run the SQL from Step 5 to promote yourself, or re-run `bun run db:seed`.

**Storage uploads return 403**
→ RLS policies restrict writes. Ensure `supabase/setup.sql` ran successfully and you're signed in as an admin for `posters`/`backdrops` uploads.
