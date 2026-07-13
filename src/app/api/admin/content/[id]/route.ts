import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'movie'

  try {
    const supabase = createAdminSupabaseClient()
    if (type === 'movie') {
      const { data: item, error } = await supabase
        .from('Movie')
        .select('*, genres:Genre!Movie_genres(*), categories:Category!Movie_categories(*), servers:MovieServer(*, server:StreamingServer(*))')
        .eq('id', id)
        .maybeSingle()
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ item })
    } else {
      const { data: item, error } = await supabase
        .from('Series')
        .select('*, genres:Genre!Series_genres(*), categories:Category!Series_categories(*), seasons:Season(*, episodes:Episode(*))')
        .eq('id', id)
        .maybeSingle()
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      // Sort seasons + episodes by number to match Prisma orderBy
      if (item.seasons) {
        item.seasons.sort((a: any, b: any) => a.seasonNumber - b.seasonNumber)
        for (const s of item.seasons) {
          if (Array.isArray(s.episodes)) {
            s.episodes.sort((a: any, b: any) => a.episodeNumber - b.episodeNumber)
          }
        }
      }
      return NextResponse.json({ item })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
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
    slug: data.slug,
    synopsis: data.synopsis,
    posterUrl: data.posterUrl,
    backdropUrl: data.backdropUrl,
    logoUrl: data.logoUrl ?? null,
    releaseYear: Number(data.releaseYear) || 0,
    rating: Number(data.rating) || 0,
    voteCount: Number(data.voteCount) || 0,
    trailerUrl: data.trailerUrl ?? null,
    featured: Boolean(data.featured),
    trending: Boolean(data.trending),
    popular: Boolean(data.popular),
    topRated: Boolean(data.topRated),
    recentlyUpdated: true,
    status: data.status ?? 'published',
    cast,
  }
  if (isMovie) row.runtime = Number(data.runtime) || 0

  try {
    const supabase = createAdminSupabaseClient()

    if (isMovie) {
      const { data: updated, error } = await supabase
        .from('Movie')
        .update(row)
        .eq('id', id)
        .select()
        .single()
      if (error || !updated) {
        return NextResponse.json(
          { error: error?.message ?? 'Update failed' },
          { status: error?.code === '23505' ? 409 : (error ? 500 : 404) },
        )
      }
      // Replace genre junction rows
      await supabase.from('Movie_genres').delete().eq('movieId', id)
      if (genreIds.length > 0) {
        await supabase
          .from('Movie_genres')
          .insert(genreIds.map((gid) => ({ movieId: id, genreId: gid })))
      }
      // Replace category junction rows
      await supabase.from('Movie_categories').delete().eq('movieId', id)
      if (categoryIds.length > 0) {
        await supabase
          .from('Movie_categories')
          .insert(categoryIds.map((cid) => ({ movieId: id, categoryId: cid })))
      }
      // Replace server rows
      await supabase.from('MovieServer').delete().eq('movieId', id)
      for (const s of servers) {
        if (!s.serverId || !s.embedUrl) continue
        await supabase.from('MovieServer').insert({
          movieId: id,
          serverId: s.serverId,
          embedUrl: s.embedUrl,
          quality: s.quality ?? 'Auto',
          priority: Number(s.priority) || 0,
          status: s.status ?? 'active',
        })
      }
      return NextResponse.json({ item: updated })
    } else {
      const { data: updated, error } = await supabase
        .from('Series')
        .update(row)
        .eq('id', id)
        .select()
        .single()
      if (error || !updated) {
        return NextResponse.json(
          { error: error?.message ?? 'Update failed' },
          { status: error?.code === '23505' ? 409 : (error ? 500 : 404) },
        )
      }
      // Replace genre junction rows
      await supabase.from('Series_genres').delete().eq('seriesId', id)
      if (genreIds.length > 0) {
        await supabase
          .from('Series_genres')
          .insert(genreIds.map((gid) => ({ seriesId: id, genreId: gid })))
      }
      // Replace category junction rows
      await supabase.from('Series_categories').delete().eq('seriesId', id)
      if (categoryIds.length > 0) {
        await supabase
          .from('Series_categories')
          .insert(categoryIds.map((cid) => ({ seriesId: id, categoryId: cid })))
      }
      return NextResponse.json({ item: updated })
    }
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
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'movie'

  try {
    const supabase = createAdminSupabaseClient()
    const table = type === 'movie' ? 'Movie' : 'Series'
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
