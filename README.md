# Gstream — Premium OTT Streaming Platform

A production-ready streaming service built on **Next.js 16**, **Supabase** (PostgreSQL + Auth + Storage), **Tailwind CSS**, and **shadcn/ui**. Movies, TV series, and anime with an embed-based player, admin dashboard, user profiles, and more.

---

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials (see below)

# 3. Run the SQL schema in Supabase (see Step 3 below)

# 4. Seed demo content
bun run db:seed

# 5. Start the dev server
bun run dev
```

The app runs at `http://localhost:3000`.

> **Note:** The app loads normally even without Supabase credentials — you'll see empty pages (no content). A small warning banner appears in the Admin Dashboard. Never is the app replaced with a setup or onboarding screen.

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Choose a name, set a strong database password, pick a region close to your users.
3. Wait ~2 minutes for provisioning.
4. Go to **Project Settings → API** and collect:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Step 2 — Configure Environment Variables

### Local development
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### Vercel deployment
In your Vercel project → **Settings → Environment Variables**, add all 3 variables for **Production**, **Preview**, and **Development**.

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` must NEVER be prefixed with `NEXT_PUBLIC_`. It bypasses RLS and is server-only.

---

## Step 3 — Import the SQL Schema

1. Open the file `supabase/schema.sql` from this repo.
2. In your Supabase Dashboard, go to **SQL Editor → New query**.
3. Paste the entire contents of `supabase/schema.sql` and click **Run**.

This creates:
- All database tables (Movie, Series, Season, Episode, Genre, Category, StreamingServer, etc.)
- Junction tables for many-to-many relations (Movie_genres, Series_genres, etc.)
- An auth trigger that auto-creates a user profile row when someone signs up
- **Row Level Security (RLS) policies** — public read for catalogue, owner-only for user activity
- **Storage buckets**: `posters`, `backdrops`, `avatars`, `thumbnails` (with RLS policies)

---

## Step 4 — Configure Storage Buckets

The SQL schema (Step 3) automatically creates the storage buckets and their RLS policies. No additional configuration is needed.

| Bucket | Public | Write access | Used for |
|---|---|---|---|
| `posters` | ✅ | Admin only | Movie/series poster uploads |
| `backdrops` | ✅ | Admin only | Movie/series backdrop uploads |
| `avatars` | ✅ | Owner (authenticated) | User profile avatars |
| `thumbnails` | ✅ | Admin only | Episode thumbnails |

If you need to verify the buckets exist, check **Supabase Dashboard → Storage**.

---

## Step 5 — Seed Demo Content

```bash
bun run db:seed
```

This creates:
- 6 streaming servers (VidFast, Filemoon, StreamWish, VidHide, MixDrop, Voe)
- 19 genres + 8 categories
- 20 movies, 7 TV series, 6 anime (with seasons, episodes, and embed URLs)
- Featured banners
- 2 auth users:
  - **Admin:** `admin@gstream.com` / `admin123`
  - **User:** `user@gstream.com` / `user123`

> The seed script requires `SUPABASE_SERVICE_ROLE_KEY` to be set. If you prefer to create the admin yourself, register at `/register` then run this SQL in the Supabase SQL Editor:
> ```sql
> update public."User" set role = 'admin' where email = 'your-email@example.com';
> ```

---

## Step 6 — Deploy to Vercel

1. Push the project to a GitHub/GitLab/Bitbucket repository.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Vercel auto-detects Next.js — no build config needed.
4. Add the 3 environment variables (from Step 2) in **Settings → Environment Variables**.
5. Click **Deploy**.

That's it — no additional code changes needed.

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui |
| Database | Supabase PostgreSQL |
| ORM / DB client | `@supabase/supabase-js` (no Prisma) |
| Auth | Supabase Auth (`@supabase/ssr` for cookie sessions) |
| Storage | Supabase Storage (posters, backdrops, avatars, thumbnails) |
| Hosting | Vercel |

### Database access
All database queries use `@supabase/supabase-js`:
- **Server components / API routes** use `createServerSupabaseClient()` (cookie-aware, RLS-enforced)
- **Admin API routes** use `createAdminSupabaseClient()` (service-role, bypasses RLS)
- **Client components** use `createBrowserSupabaseClient()` (singleton)

### Authentication flow
1. **Register** → `supabase.auth.signUp()` → trigger creates `public."User"` profile
2. **Login** → `supabase.auth.signInWithPassword()` → session cookie set via `@supabase/ssr`
3. **Protected routes** → `requireAuth()` / `requireAdmin()` reads session + profile
4. **Logout** → `supabase.auth.signOut()`
5. **Password reset** → `supabase.auth.resetPasswordForEmail()` → email link → `/reset-password`

---

## Features

- **Home** — cinematic hero carousel, 9 content rows (Trending, Continue Watching, Recently Added, Popular Movies/Series/Anime, Top Rated, Recommended, Recently Updated)
- **Browse** — Movies, TV Series, Anime pages with genre filters and sorting
- **Search** — instant search by title, genre, actor, year with type tabs
- **Watch page** — iframe embed player with server selector (switch servers without page refresh), episodes, seasons, synopsis, cast, recommendations
- **User features** — Profile (avatar, name, password change), My List, Watch History, Continue Watching
- **Admin panel** — Dashboard with stats, full CRUD for Movies/Series/Anime/Seasons/Episodes/Genres/Categories/Banners/Servers/Users, storage uploads
- **Auth** — Supabase Auth with email/password, password reset, role-based access (single admin)
- **Responsive** — desktop, laptop, tablet, mobile
- **Dark mode only** — premium purple/violet cinematic theme

---

## Project Structure

```
src/
  app/                    # Next.js App Router pages + API routes
    api/                  # API routes (auth, my-list, watch, search, admin)
    admin/                # Admin dashboard pages
    watch/[type]/[id]/    # Watch page
    movies/ tv-series/ anime/ search/  # Browse pages
    login/ register/ profile/ my-list/ watch-history/  # User pages
  components/
    layout/               # Header, Footer, AppShell, AuthShell, BrandMark
    content/              # HeroBanner, ContentCard, ContentRow, SmartImage
    watch/                # EmbedPlayer, EpisodeSelector, WatchClient
    admin/                # AdminShell, ContentManager, AdminSupabaseBanner
    ui/                   # shadcn/ui components
  lib/
    supabase/             # Supabase clients (server, client, admin, configured)
    auth.ts               # Supabase Auth wrappers
    content.ts            # Data-access layer (all catalogue queries)
    types.ts              # Shared TypeScript types
  hooks/                  # Client hooks (useSession, useMyList)
supabase/
  schema.sql              # Complete SQL schema + RLS + storage + trigger
prisma/
  seed.ts                 # Seed script (uses Supabase admin client)
.env.example              # All required env vars
```

---

## Demo Accounts

After seeding:
- **Admin:** `admin@gstream.com` / `admin123`
- **User:** `user@gstream.com` / `user123`

---

## Troubleshooting

**Pages show empty content**
→ Supabase env vars are not set or the schema hasn't been imported. Run `supabase/schema.sql` in the SQL Editor and run `bun run db:seed`.

**Admin dashboard shows a warning banner**
→ Supabase is not configured. Set the 3 environment variables and restart.

**Can't log in**
→ Ensure `supabase/schema.sql` was run (it creates the auth trigger). Without the trigger, the profile row isn't created on signup.

**Storage uploads fail (403)**
→ RLS policies restrict writes. Ensure you're signed in as an admin for poster/backdrop uploads. The schema.sql sets up the policies automatically.

**"Invalid API key" error**
→ Double-check the anon key and service-role key are copied correctly from Supabase Dashboard → Settings → API.
