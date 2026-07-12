import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'movie'

  if (type === 'movie') {
    const item = await db.movie.findUnique({
      where: { id },
      include: {
        genres: true,
        categories: true,
        servers: { include: { server: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ item })
  } else {
    const item = await db.series.findUnique({
      where: { id },
      include: {
        genres: true,
        categories: true,
        seasons: { include: { episodes: { orderBy: { episodeNumber: 'asc' } } } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ item })
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

  const genreIds: string[] = data.genreIds ?? []
  const categoryIds: string[] = data.categoryIds ?? []
  delete data.genreIds
  delete data.categoryIds
  delete data.type

  const updateData: any = {
    title: data.title,
    slug: data.slug,
    synopsis: data.synopsis,
    posterUrl: data.posterUrl,
    backdropUrl: data.backdropUrl,
    logoUrl: data.logoUrl ?? null,
    releaseYear: Number(data.releaseYear),
    rating: Number(data.rating),
    voteCount: Number(data.voteCount),
    trailerUrl: data.trailerUrl ?? null,
    featured: Boolean(data.featured),
    trending: Boolean(data.trending),
    popular: Boolean(data.popular),
    topRated: Boolean(data.topRated),
    recentlyUpdated: true,
    status: data.status ?? 'published',
    cast: data.cast ? (typeof data.cast === 'string' ? data.cast : JSON.stringify(data.cast)) : '[]',
    genres: { set: [], connect: genreIds.map((id: string) => ({ id })) },
    categories: { set: [], connect: categoryIds.map((id: string) => ({ id })) },
  }
  if (isMovie) updateData.runtime = Number(data.runtime) ?? 0

  if (isMovie) {
    const updated = await db.movie.update({ where: { id }, data: updateData })
    // Replace servers
    await db.movieServer.deleteMany({ where: { movieId: id } })
    if (Array.isArray(data.servers)) {
      for (const s of data.servers) {
        if (!s.serverId || !s.embedUrl) continue
        await db.movieServer.create({
          data: {
            movieId: id,
            serverId: s.serverId,
            embedUrl: s.embedUrl,
            quality: s.quality ?? 'Auto',
            priority: Number(s.priority) ?? 0,
            status: s.status ?? 'active',
          },
        })
      }
    }
    return NextResponse.json({ item: updated })
  } else {
    const updated = await db.series.update({ where: { id }, data: updateData })
    return NextResponse.json({ item: updated })
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

  if (type === 'movie') {
    await db.movie.delete({ where: { id } })
  } else {
    await db.series.delete({ where: { id } })
  }
  return NextResponse.json({ ok: true })
}
