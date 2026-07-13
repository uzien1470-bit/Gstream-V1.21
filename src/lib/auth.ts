import { createServerSupabaseClient } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: 'user' | 'admin'
  status: string
  avatarUrl: string | null
}

/**
 * Returns the current authenticated user's profile or null.
 * Uses Supabase Auth for the session and the `public."User"` profile table
 * (read via the same Supabase client) for role/status/avatar.
 *
 * Gracefully returns null when Supabase is unreachable/unconfigured so the
 * public site keeps loading.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error: profileErr } = await supabase
      .from('User')
      .select('id, email, name, role, status, avatarUrl')
      .eq('id', user.id)
      .single()
    if (profileErr) {
      // PGRST116 = no rows found (user has auth session but no profile row yet,
      // e.g. trigger hasn't fired). Treat as logged-out. Log other errors.
      if (profileErr.code !== 'PGRST116') {
        console.error('[auth] profile fetch failed:', profileErr.message)
      }
      return null
    }
    if (!profile) return null
    if ((profile as any).status === 'suspended') return null

    return {
      id: (profile as any).id,
      email: (profile as any).email,
      name: (profile as any).name,
      role: (profile as any).role as 'user' | 'admin',
      status: (profile as any).status,
      avatarUrl: (profile as any).avatarUrl,
    }
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getSessionUser()
  if (!user) throw new Error('UNAUTHORIZED')
  if (user.status === 'suspended') throw new Error('SUSPENDED')
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') throw new Error('FORBIDDEN')
  return user
}

export function authErrorStatus(err: unknown): number {
  const msg = err instanceof Error ? err.message : ''
  if (msg === 'SUSPENDED') return 403
  if (msg === 'FORBIDDEN') return 403
  return 401
}
