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

  const row: Record<string, any> = {}
  if (body.name !== undefined) row.name = String(body.name).trim()
  if (body.imageUrl !== undefined) row.imageUrl = String(body.imageUrl).trim()
  if (body.displayOrder !== undefined) row.displayOrder = Number(body.displayOrder) || 0
  if (body.enabled !== undefined) row.enabled = Boolean(body.enabled)

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase.from('Avatar').update(row).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const supabase = createAdminSupabaseClient()

  // Clear avatarId on users referencing this avatar (FK is ON DELETE SET NULL,
  // but do it explicitly for safety)
  await supabase.from('User').update({ avatarId: null }).eq('avatarId', id)

  const { error } = await supabase.from('Avatar').delete({ count: 'exact' }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
