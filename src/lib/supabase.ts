/**
 * Gstream — Supabase client configuration (single entry point).
 *
 * Exports three clients + an env-var check:
 *   - createServerSupabaseClient()  → server components / API routes (cookie-aware, RLS-enforced)
 *   - createBrowserSupabaseClient() → client components (singleton)
 *   - createAdminSupabaseClient()   → service-role, bypasses RLS — SERVER ONLY
 *   - isSupabaseConfigured()        → true when env vars are present
 *
 * Environment variables (see .env.example):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY   (server-only, never expose to the browser)
 */
import { createServerClient, createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// ───────────────────────────── Config ─────────────────────────────

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/** Returns true when Supabase env vars are configured. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

// ───────────────────────────── Server client ─────────────────────────────

/**
 * Supabase client for server components and API routes.
 * Reads/writes the auth session cookie via @supabase/ssr.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Called from a Server Component — safe to ignore since middleware
          // will refresh the session.
        }
      },
    },
  })
}

// ───────────────────────────── Browser client ─────────────────────────────

let browserClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Supabase client for client components.
 * Singleton — reuse the same instance across the browser session.
 */
export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return browserClient
}

// ───────────────────────────── Admin (service-role) client ─────────────────────────────

/**
 * Supabase admin client using the service-role key.
 * Bypasses RLS. Use ONLY on the server (API routes) for admin operations
 * such as deleting auth.users, uploading to Storage, or seeding.
 *
 * NEVER expose this client to the browser.
 */
export function createAdminSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
