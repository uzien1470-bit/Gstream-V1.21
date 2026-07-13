import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
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

  // Fetch profile to check status
  const { data: profile } = await supabase
    .from('User')
    .select('id, email, name, role, status, avatarUrl')
    .eq('id', data.user.id)
    .single()
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }
  if ((profile as any).status === 'suspended') {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: 'Account suspended. Contact support.' },
      { status: 403 },
    )
  }

  const p = profile as any
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
