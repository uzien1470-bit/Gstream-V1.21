import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).max(60),
  avatarUrl: z.string().url().nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    try {
      const supabase = await createServerSupabaseClient()

      // Sync name to Supabase Auth user metadata too (best-effort)
      await supabase.auth.updateUser({ data: { name: parsed.data.name } })

      const update: Record<string, unknown> = { name: parsed.data.name }
      if (parsed.data.avatarUrl !== undefined) {
        update.avatarUrl = parsed.data.avatarUrl
      }

      const { data: updated, error } = await supabase
        .from('User')
        .update(update)
        .eq('id', user.id)
        .select('id, email, name, role, avatarUrl')
        .single()

      if (error || !updated) {
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 },
        )
      }

      const u = updated as {
        id: string
        email: string
        name: string | null
        role: string
        avatarUrl: string | null
      }
      return NextResponse.json({
        user: {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          avatarUrl: u.avatarUrl,
        },
      })
    } catch {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 },
      )
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
