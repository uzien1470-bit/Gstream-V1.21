import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: 'user' | 'admin'
  status: string
  avatarUrl: string | null
  avatarId: string | null
}

/**
 * Returns the current authenticated user's profile or null.
 * Uses Supabase Auth for the session and the `public."User"` profile table
 * for role/status/avatar.
 *
 * Resolves avatarId → imageUrl from the Avatar table. Falls back to the
 * legacy avatarUrl column if avatarId is not set.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    // Try reading the profile with the anon (RLS-enforced) client first.
    let { data: profile, error: profileErr } = await supabase
      .from('User')
      .select('id, email, name, role, status, avatarUrl, avatarId')
      .eq('id', user.id)
      .single()

    // Fallback: if the anon client failed, use the admin (service-role) client.
    if (profileErr && !profile) {
      const admin = createAdminSupabaseClient()
      const { data: adminProfile, error: adminErr } = await admin
        .from('User')
        .select('id, email, name, role, status, avatarUrl, avatarId')
        .eq('id', user.id)
        .single()
      if (adminErr) {
        console.error('[auth] profile fetch failed (admin fallback):', adminErr.message)
        return null
      }
      profile = adminProfile
    }

    if (!profile) return null
    if ((profile as any).status === 'suspended') return null

    const p = profile as any

    // Resolve avatar: if avatarId is set, fetch the Avatar imageUrl;
    // otherwise fall back to the legacy avatarUrl column.
    let resolvedAvatarUrl: string | null = p.avatarUrl ?? null
    if (p.avatarId) {
      try {
        const admin = createAdminSupabaseClient()
        const { data: avatar } = await admin
          .from('Avatar')
          .select('imageUrl')
          .eq('id', p.avatarId)
          .maybeSingle()
        if (avatar?.imageUrl) {
          resolvedAvatarUrl = avatar.imageUrl
        }
      } catch {
        // Keep fallback avatarUrl
      }
    }

    return {
      id: p.id,
      email: p.email,
      name: p.name,
      role: p.role as 'user' | 'admin',
      status: p.status,
      avatarUrl: resolvedAvatarUrl,
      avatarId: p.avatarId ?? null,
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
