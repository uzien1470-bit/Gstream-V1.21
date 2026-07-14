import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { email, password } = parsed.data

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? 'Invalid credentials' },
      { status: 401 },
    )
  }

  // Fetch profile using the anon client (RLS allows self-read)
  let { data: profile, error: profileErr } = await supabase
    .from('User')
    .select('id, email, name, role, status, avatarUrl')
    .eq('id', data.user.id)
    .single()

  // Auto-create profile if missing. Use the admin (service-role) client
  // because RLS may block inserts and the auth trigger may not have fired.
  if (!profile && profileErr) {
    const admin = createAdminSupabaseClient()
    const { data: newProfile, error: createErr } = await admin
      .from('User')
      .upsert({
        id: data.user.id,
        email: data.user.email ?? email,
        name: (data.user.user_metadata?.name as string) || email.split('@')[0],
        role: 'user',
        status: 'active',
      }, { onConflict: 'id' })
      .select('id, email, name, role, status, avatarUrl')
      .single()

    if (createErr) {
      console.error('[auth/login] profile auto-create failed:', createErr.message)
      return NextResponse.json(
        { error: 'Failed to create user profile. Please contact support.' },
        { status: 500 },
      )
    }
    profile = newProfile
  }

  if (!profile) {
    console.error('[auth/login] profile fetch failed:', profileErr?.message)
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const p = profile as any
  if (p.status === 'suspended') {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: 'Account suspended. Contact support.' },
      { status: 403 },
    )
  }

  return NextResponse.json({
    user: {
      id: p.id,
      email: p.email,
      name: p.name,
      role: p.role,
      avatarUrl: p.avatarUrl,
    },
  })
}
