import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).max(60),
  avatarId: z.string().nullable().optional(),
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
      if (parsed.data.avatarId !== undefined) {
        update.avatarId = parsed.data.avatarId
      }
      if (parsed.data.avatarUrl !== undefined) {
        update.avatarUrl = parsed.data.avatarUrl
      }

      const { data: updated, error } = await supabase
        .from('User')
        .update(update)
        .eq('id', user.id)
        .select('id, email, name, role, avatarUrl, avatarId')
        .single()

      if (error || !updated) {
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 },
        )
      }

      const u = updated as any

      // Resolve avatarId → imageUrl for the response
      let resolvedAvatarUrl = u.avatarUrl
      if (u.avatarId) {
        const admin = createAdminSupabaseClient()
        const { data: avatar } = await admin
          .from('Avatar')
          .select('imageUrl')
          .eq('id', u.avatarId)
          .maybeSingle()
        if (avatar?.imageUrl) resolvedAvatarUrl = avatar.imageUrl
      }

      return NextResponse.json({
        user: {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          avatarUrl: resolvedAvatarUrl,
          avatarId: u.avatarId ?? null,
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
