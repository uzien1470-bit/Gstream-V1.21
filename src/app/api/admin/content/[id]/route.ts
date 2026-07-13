import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
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

  const genreIds: string[] | undefined = Array.isArray(data.genreIds) ? data.genreIds : undefined
  const categoryIds: string[] | undefined = Array.isArray(data.categoryIds) ? data.categoryIds : undefined
  const servers: any[] | undefined = Array.isArray(data.servers) ? data.servers : undefined

  // Build the update row CONDITIONALLY so a partial update (e.g. toggling only
  // `featured`) does NOT reset every omitted field to its default value.
  const row: any = { recentlyUpdated: true }
  if (data.title !== undefined) row.title = data.title
  if (data.slug !== undefined) row.slug = data.slug
  if (data.synopsis !== undefined) row.synopsis = data.synopsis
  if (data.posterUrl !== undefined) row.posterUrl = data.posterUrl
  if (data.backdropUrl !== undefined) row.backdropUrl = data.backdropUrl
  if (data.logoUrl !== undefined) row.logoUrl = data.logoUrl ?? null
  if (data.releaseYear !== undefined) row.releaseYear = Number(data.releaseYear)
  if (data.rating !== undefined) row.rating = Number(data.rating)
  if (data.voteCount !== undefined) row.voteCount = Number(data.voteCount)
  if (data.trailerUrl !== undefined) row.trailerUrl = data.trailerUrl ?? null
  if (data.featured !== undefined) row.featured = Boolean(data.featured)
  if (data.trending !== undefined) row.trending = Boolean(data.trending)
  if (data.popular !== undefined) row.popular = Boolean(data.popular)
  if (data.topRated !== undefined) row.topRated = Boolean(data.topRated)
  if (data.status !== undefined) row.status = data.status
  if (data.cast !== undefined) row.cast = typeof data.cast === 'string' ? data.cast : JSON.stringify(data.cast)
  if (isMovie && data.runtime !== undefined) row.runtime = Number(data.runtime)

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
      // Replace genre junction rows (only if provided in the request)
      if (genreIds !== undefined) {
        const { error: gDelErr } = await supabase.from('Movie_genres').delete().eq('movieId', id)
        if (gDelErr) {
          console.error('[admin/content PUT movie] Movie_genres delete:', gDelErr.message)
          return NextResponse.json({ error: 'Failed to clear genres: ' + gDelErr.message }, { status: 500 })
        }
        if (genreIds.length > 0) {
          const gRows = genreIds.map((gid) => ({ movieId: id, genreId: gid }))
          const { error: gInsErr } = await supabase.from('Movie_genres').insert(gRows)
          if (gInsErr) {
            console.error('[admin/content PUT movie] Movie_genres insert:', gInsErr.message)
            return NextResponse.json({ error: 'Failed to link genres: ' + gInsErr.message }, { status: 500 })
          }
        }
      }
      // Replace category junction rows (only if provided in the request)
      if (categoryIds !== undefined) {
        const { error: cDelErr } = await supabase.from('Movie_categories').delete().eq('movieId', id)
        if (cDelErr) {
          console.error('[admin/content PUT movie] Movie_categories delete:', cDelErr.message)
          return NextResponse.json({ error: 'Failed to clear categories: ' + cDelErr.message }, { status: 500 })
        }
        if (categoryIds.length > 0) {
          const cRows = categoryIds.map((cid) => ({ movieId: id, categoryId: cid }))
          const { error: cInsErr } = await supabase.from('Movie_categories').insert(cRows)
          if (cInsErr) {
            console.error('[admin/content PUT movie] Movie_categories insert:', cInsErr.message)
            return NextResponse.json({ error: 'Failed to link categories: ' + cInsErr.message }, { status: 500 })
          }
        }
      }
      // Replace server rows (only if provided in the request)
      if (servers !== undefined) {
        const { error: sDelErr } = await supabase.from('MovieServer').delete().eq('movieId', id)
        if (sDelErr) {
          console.error('[admin/content PUT movie] MovieServer delete:', sDelErr.message)
          return NextResponse.json({ error: 'Failed to clear servers: ' + sDelErr.message }, { status: 500 })
        }
        for (const s of servers) {
          if (!s.serverId || !s.embedUrl) continue
          const { error: sInsErr } = await supabase.from('MovieServer').insert({
            movieId: id,
            serverId: s.serverId,
            embedUrl: s.embedUrl,
            quality: s.quality ?? 'Auto',
            priority: Number(s.priority) || 0,
            status: s.status ?? 'active',
          })
          if (sInsErr) {
            console.error('[admin/content PUT movie] MovieServer insert:', sInsErr.message)
            return NextResponse.json({ error: 'Failed to link server: ' + sInsErr.message }, { status: 500 })
          }
        }
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
      // Replace genre junction rows (only if provided in the request)
      if (genreIds !== undefined) {
        const { error: gDelErr } = await supabase.from('Series_genres').delete().eq('seriesId', id)
        if (gDelErr) {
          console.error('[admin/content PUT series] Series_genres delete:', gDelErr.message)
          return NextResponse.json({ error: 'Failed to clear genres: ' + gDelErr.message }, { status: 500 })
        }
        if (genreIds.length > 0) {
          const gRows = genreIds.map((gid) => ({ seriesId: id, genreId: gid }))
          const { error: gInsErr } = await supabase.from('Series_genres').insert(gRows)
          if (gInsErr) {
            console.error('[admin/content PUT series] Series_genres insert:', gInsErr.message)
            return NextResponse.json({ error: 'Failed to link genres: ' + gInsErr.message }, { status: 500 })
          }
        }
      }
      // Replace category junction rows (only if provided in the request)
      if (categoryIds !== undefined) {
        const { error: cDelErr } = await supabase.from('Series_categories').delete().eq('seriesId', id)
        if (cDelErr) {
          console.error('[admin/content PUT series] Series_categories delete:', cDelErr.message)
          return NextResponse.json({ error: 'Failed to clear categories: ' + cDelErr.message }, { status: 500 })
        }
        if (categoryIds.length > 0) {
          const cRows = categoryIds.map((cid) => ({ seriesId: id, categoryId: cid }))
          const { error: cInsErr } = await supabase.from('Series_categories').insert(cRows)
          if (cInsErr) {
            console.error('[admin/content PUT series] Series_categories insert:', cInsErr.message)
            return NextResponse.json({ error: 'Failed to link categories: ' + cInsErr.message }, { status: 500 })
          }
        }
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
    const { error, count } = await supabase.from(table).delete({ count: 'exact' }).eq('id', id)
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
