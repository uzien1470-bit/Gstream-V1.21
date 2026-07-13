import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  try {
    const supabase = createAdminSupabaseClient()
    const row = {
      seasonNumber: Number(body.seasonNumber),
      title: body.title,
      description: body.description ?? null,
      posterUrl: body.posterUrl ?? null,
    }
    const { data: updated, error } = await supabase
      .from('Season')
      .update(row)
      .eq('id', id)
      .select()
      .single()
    if (error || !updated) {
      return NextResponse.json(
        { error: error?.message ?? 'Season not found' },
        { status: error ? 500 : 404 },
      )
    }
    return NextResponse.json({ item: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params

  try {
    const supabase = createAdminSupabaseClient()
    const { error } = await supabase.from('Season').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
