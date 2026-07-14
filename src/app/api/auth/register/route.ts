import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).max(60).optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { email, password, name } = parsed.data

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name || email.split('@')[0] } },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Auto-create the profile row using the admin (service-role) client.
  // The auth trigger (handle_new_user) should do this, but we do it here
  // too as a fallback in case the trigger didn't fire or RLS blocked it.
  if (data.user) {
    const admin = createAdminSupabaseClient()
    const { error: profileErr } = await admin.from('User').upsert({
      id: data.user.id,
      email: data.user.email ?? email,
      name: name || email.split('@')[0],
      role: 'user',
      status: 'active',
    }, { onConflict: 'id' })
    if (profileErr) {
      console.warn('[auth/register] profile upsert:', profileErr.message)
    }
  }

  return NextResponse.json({
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email ?? email,
          name: name ?? null,
          role: 'user',
          avatarUrl: null,
        }
      : null,
  })
}
