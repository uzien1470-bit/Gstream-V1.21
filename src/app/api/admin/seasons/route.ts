import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { searchParams } = new URL(req.url)
  const seriesId = searchParams.get('seriesId')
  const q = searchParams.get('q') ?? ''

  try {
    const supabase = createAdminSupabaseClient()

    let seriesIds: string[] | null = null
    if (q) {
      const { data: matching } = await supabase
        .from('Series')
        .select('id')
        .or(`title.ilike.%${q}%,type.ilike.%${q}%`)
      seriesIds = (matching ?? []).map((s: any) => s.id)
      if (seriesIds.length === 0) return NextResponse.json({ items: [] })
    }

    let query = supabase
      .from('Season')
      .select('*, series:Series(id, title, type, posterUrl)', { count: 'exact' })
      .order('createdAt', { ascending: false })

    if (seriesId) query = query.eq('seriesId', seriesId)
    else if (seriesIds) query = query.in('seriesId', seriesIds)

    const { data: seasons, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Compute episode counts per season (Prisma's `_count: { select: { episodes: true } }`)
    let items: any[] = seasons ?? []
    if (items.length > 0) {
      const seasonIds = items.map((s) => s.id)
      const { data: episodes } = await supabase
        .from('Episode')
        .select('seasonId')
        .in('seasonId', seasonIds)
      const counts: Record<string, number> = {}
      for (const e of episodes ?? []) {
        counts[e.seasonId] = (counts[e.seasonId] ?? 0) + 1
      }
      items = items.map((s) => ({ ...s, _count: { episodes: counts[s.id] ?? 0 } }))
    }

    return NextResponse.json({ items })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  try {
    const supabase = createAdminSupabaseClient()

    // Verify the series exists
    const { data: series, error: seriesErr } = await supabase
      .from('Series')
      .select('id')
      .eq('id', body.seriesId)
      .maybeSingle()
    if (seriesErr || !series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 })
    }

    const row = {
      seriesId: body.seriesId,
      seasonNumber: Number(body.seasonNumber),
      title: body.title || `Season ${body.seasonNumber}`,
      description: body.description ?? null,
      posterUrl: body.posterUrl ?? null,
    }
    const { data: created, error } = await supabase
      .from('Season')
      .insert(row)
      .select()
      .single()
    if (error || !created) {
      return NextResponse.json(
        { error: error?.message ?? 'Failed to create season' },
        { status: 500 },
      )
    }
    // Mark series as recently updated
    await supabase.from('Series').update({ recentlyUpdated: true }).eq('id', body.seriesId)
    return NextResponse.json({ item: created })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
