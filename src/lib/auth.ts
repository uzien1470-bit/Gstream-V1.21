import { createServerSupabaseClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: 'user' | 'admin'
  status: string
  avatarUrl: string | null
}

/**
 * Returns the current authenticated user's profile (from Prisma) or null.
 * Uses Supabase Auth for session management and Prisma for profile data.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch the profile row from Prisma (public."User")
  const profile = await db.user.findUnique({ where: { id: user.id } })
  if (!profile) return null
  if (profile.status === 'suspended') return null

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as 'user' | 'admin',
    status: profile.status,
    avatarUrl: profile.avatarUrl,
  }
}

/**
 * Throws 'UNAUTHORIZED' if not signed in, 'SUSPENDED' if the account is
 * suspended. API routes catch these and return 401/403.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getSessionUser()
  if (!user) throw new Error('UNAUTHORIZED')
  if (user.status === 'suspended') throw new Error('SUSPENDED')
  return user
}

/**
 * Throws if not an admin. Used by all /api/admin/* routes.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') throw new Error('FORBIDDEN')
  return user
}

/** Maps internal auth errors to HTTP status codes for API routes. */
export function authErrorStatus(err: unknown): number {
  const msg = err instanceof Error ? err.message : ''
  if (msg === 'SUSPENDED') return 403
  if (msg === 'FORBIDDEN') return 403
  return 401
}
