import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get('type') ?? 'movie') as 'movie' | 'series' | 'anime'
  const q = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const limit = Math.max(1, Number(searchParams.get('limit') ?? '50') || 50)

  const isMovie = type === 'movie'
  const table = isMovie ? 'Movie' : 'Series'

  try {
    const supabase = createAdminSupabaseClient()

    let baseQuery = supabase.from(table).select(
      isMovie
        ? '*, genres:Genre!Movie_genres(name), servers:MovieServer(*, server:StreamingServer(*))'
        : '*, genres:Genre!Series_genres(name), seasons:Season(*)',
      { count: 'exact' },
    )

    if (!isMovie) baseQuery = baseQuery.eq('type', type)
    if (q) baseQuery = baseQuery.or(`title.ilike.%${q}%,synopsis.ilike.%${q}%`)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await baseQuery
      .order('createdAt', { ascending: false })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // For series: compute episode counts per season and add `_count.episodes`
    let items: any[] = data ?? []
    if (!isMovie && items.length > 0) {
      const seasonIds = items.flatMap((it) => (it.seasons ?? []).map((s: any) => s.id))
      if (seasonIds.length > 0) {
        const { data: episodes } = await supabase
          .from('Episode')
          .select('seasonId')
          .in('seasonId', seasonIds)
        const counts: Record<string, number> = {}
        for (const e of episodes ?? []) {
          counts[e.seasonId] = (counts[e.seasonId] ?? 0) + 1
        }
        items = items.map((it) => ({
          ...it,
          seasons: (it.seasons ?? []).map((s: any) => ({
            ...s,
            _count: { episodes: counts[s.id] ?? 0 },
          })),
        }))
      }
    }

    return NextResponse.json({ items, total: count ?? 0, page, limit })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const { type, ...data } = body
  const isMovie = type === 'movie'

  const genreIds: string[] = Array.isArray(data.genreIds) ? data.genreIds : []
  const categoryIds: string[] = Array.isArray(data.categoryIds) ? data.categoryIds : []
  const servers: any[] = Array.isArray(data.servers) ? data.servers : []
  const cast = data.cast ? (typeof data.cast === 'string' ? data.cast : JSON.stringify(data.cast)) : '[]'

  const row: any = {
    title: data.title,
    slug: data.slug || slugify(String(data.title ?? '')),
    synopsis: data.synopsis ?? '',
    posterUrl: data.posterUrl ?? '',
    backdropUrl: data.backdropUrl ?? '',
    logoUrl: data.logoUrl ?? null,
    releaseYear: Number(data.releaseYear) || new Date().getFullYear(),
    rating: Number(data.rating) || 0,
    voteCount: Number(data.voteCount) || 0,
    trailerUrl: data.trailerUrl ?? null,
    featured: Boolean(data.featured),
    trending: Boolean(data.trending),
    popular: Boolean(data.popular),
    topRated: Boolean(data.topRated),
    recentlyAdded: true,
    recentlyUpdated: true,
    status: data.status ?? 'published',
    cast,
  }

  try {
    const supabase = createAdminSupabaseClient()

    if (isMovie) {
      row.runtime = Number(data.runtime) || 0
      row.type = 'movie'
      const { data: created, error } = await supabase
        .from('Movie')
        .insert(row)
        .select()
        .single()
      if (error || !created) {
        return NextResponse.json(
          { error: error?.message ?? 'Failed to create movie' },
          { status: error?.code === '23505' ? 409 : 500 },
        )
      }
      // Many-to-many junction rows
      if (genreIds.length > 0) {
        await supabase
          .from('Movie_genres')
          .insert(genreIds.map((gid) => ({ movieId: created.id, genreId: gid })))
      }
      if (categoryIds.length > 0) {
        await supabase
          .from('Movie_categories')
          .insert(categoryIds.map((cid) => ({ movieId: created.id, categoryId: cid })))
      }
      // Streaming server rows
      for (const s of servers) {
        if (!s.serverId || !s.embedUrl) continue
        await supabase.from('MovieServer').insert({
          movieId: created.id,
          serverId: s.serverId,
          embedUrl: s.embedUrl,
          quality: s.quality ?? 'Auto',
          priority: Number(s.priority) || 0,
          status: s.status ?? 'active',
        })
      }
      return NextResponse.json({ item: created })
    } else {
      row.type = type === 'anime' ? 'anime' : 'series'
      const { data: created, error } = await supabase
        .from('Series')
        .insert(row)
        .select()
        .single()
      if (error || !created) {
        return NextResponse.json(
          { error: error?.message ?? 'Failed to create series' },
          { status: error?.code === '23505' ? 409 : 500 },
        )
      }
      // Junction rows
      if (genreIds.length > 0) {
        await supabase
          .from('Series_genres')
          .insert(genreIds.map((gid) => ({ seriesId: created.id, genreId: gid })))
      }
      if (categoryIds.length > 0) {
        await supabase
          .from('Series_categories')
          .insert(categoryIds.map((cid) => ({ seriesId: created.id, categoryId: cid })))
      }
      return NextResponse.json({ item: created })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
