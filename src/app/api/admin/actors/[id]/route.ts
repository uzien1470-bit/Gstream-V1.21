import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const row: Record<string, any> = {}
  if (body.name !== undefined) {
    row.name = String(body.name).trim()
    if (body.slug !== undefined) row.slug = slugify(String(body.slug)) || slugify(row.name)
  }
  if (body.profilePhotoUrl !== undefined) row.profilePhotoUrl = body.profilePhotoUrl || null
  if (body.heroPhotoUrl !== undefined) row.heroPhotoUrl = body.heroPhotoUrl || null
  if (body.biography !== undefined) row.biography = body.biography || null
  if (body.birthday !== undefined) row.birthday = body.birthday || null
  if (body.birthPlace !== undefined) row.birthPlace = body.birthPlace || null
  if (body.nationality !== undefined) row.nationality = body.nationality || null
  if (body.status !== undefined) row.status = body.status

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase.from('Actor').update(row).eq('id', id).select().single()
  if (error) {
    console.error('[admin/actors PUT] error:', error.message)
    return NextResponse.json({ error: error.message }, { status: error.code === '23505' ? 409 : 500 })
  }
  return NextResponse.json({ item: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const supabase = createAdminSupabaseClient()

  // Prevent deletion if actor is connected to movies or series
  const [movieLinks, seriesLinks] = await Promise.all([
    supabase.from('MovieActor').select('movieId', { count: 'exact', head: true }).eq('actorId', id),
    supabase.from('SeriesActor').select('seriesId', { count: 'exact', head: true }).eq('actorId', id),
  ])
  const totalLinks = (movieLinks.count ?? 0) + (seriesLinks.count ?? 0)
  if (totalLinks > 0) {
    return NextResponse.json(
      { error: `Cannot delete: this actor is linked to ${totalLinks} title(s). Remove the relationships first.` },
      { status: 409 },
    )
  }

  const { error } = await supabase.from('Actor').delete({ count: 'exact' }).eq('id', id)
  if (error) {
    console.error('[admin/actors DELETE] error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
