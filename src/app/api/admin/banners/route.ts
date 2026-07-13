import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const supabase = createAdminSupabaseClient()
    const { data: items, error } = await supabase
      .from('FeaturedBanner')
      .select('*, movie:Movie(id, title), series:Series(id, title)')
      .order('order', { ascending: true })
      .order('createdAt', { ascending: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ items: items ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (!body.imageUrl || typeof body.imageUrl !== 'string' || !body.imageUrl.trim()) {
    return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
  }

  const movieId = typeof body.movieId === 'string' && body.movieId ? body.movieId : null
  const seriesId = typeof body.seriesId === 'string' && body.seriesId ? body.seriesId : null

  const row = {
    title: body.title.trim(),
    description: typeof body.description === 'string' ? body.description : '',
    imageUrl: body.imageUrl.trim(),
    logoUrl:
      typeof body.logoUrl === 'string' && body.logoUrl.trim() ? body.logoUrl.trim() : null,
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
    active: body.active !== undefined ? Boolean(body.active) : true,
    movieId,
    seriesId,
  }

  try {
    const supabase = createAdminSupabaseClient()
    const { data: item, error } = await supabase
      .from('FeaturedBanner')
      .insert(row)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ item })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
