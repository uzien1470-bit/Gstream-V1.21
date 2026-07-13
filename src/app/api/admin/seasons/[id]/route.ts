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

    // Build the update row CONDITIONALLY so a partial update does NOT reset
    // every omitted field to its default value.
    const row: any = {}
    if (body.seasonNumber !== undefined) row.seasonNumber = Number(body.seasonNumber)
    if (body.title !== undefined) row.title = body.title
    if (body.description !== undefined) row.description = body.description
    if (body.posterUrl !== undefined) row.posterUrl = body.posterUrl

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
    const { error, count } = await supabase.from('Season').delete({ count: 'exact' }).eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
