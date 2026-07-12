import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const MODEL = {
  movie: db.movie,
  series: db.series,
  anime: db.series,
} as const

export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get('type') ?? 'movie') as keyof typeof MODEL
  const q = searchParams.get('q') ?? ''
  const page = Number(searchParams.get('page') ?? '1')
  const limit = Number(searchParams.get('limit') ?? '50')

  const where: any = {}
  if (type === 'anime') where.type = 'anime'
  else if (type === 'series') where.type = 'series'
  if (q) where.title = { contains: q }

  const isMovie = type === 'movie'
  const model = isMovie ? db.movie : db.series

  const [items, total] = await Promise.all([
    model.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        genres: { select: { name: true } },
        ...(isMovie
          ? { servers: { include: { server: true } } }
          : { seasons: { include: { _count: { select: { episodes: true } } } } }),
      },
    }),
    model.count({ where }),
  ])

  return NextResponse.json({ items, total, page, limit })
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const { type, ...data } = body
  const isMovie = type === 'movie'

  // parse genres + categories
  const genreIds: string[] = data.genreIds ?? []
  const categoryIds: string[] = data.categoryIds ?? []
  delete data.genreIds
  delete data.categoryIds
  delete data.type

  const cast = data.cast ? (typeof data.cast === 'string' ? data.cast : JSON.stringify(data.cast)) : '[]'

  const createData: any = {
    title: data.title,
    slug: data.slug || (data.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    synopsis: data.synopsis ?? '',
    posterUrl: data.posterUrl ?? '',
    backdropUrl: data.backdropUrl ?? '',
    logoUrl: data.logoUrl ?? null,
    releaseYear: Number(data.releaseYear) ?? new Date().getFullYear(),
    rating: Number(data.rating) ?? 0,
    voteCount: Number(data.voteCount) ?? 0,
    trailerUrl: data.trailerUrl ?? null,
    featured: Boolean(data.featured),
    trending: Boolean(data.trending),
    popular: Boolean(data.popular),
    topRated: Boolean(data.topRated),
    recentlyAdded: true,
    recentlyUpdated: true,
    status: data.status ?? 'published',
    cast,
    genres: { connect: genreIds.map((id: string) => ({ id })) },
    categories: { connect: categoryIds.map((id: string) => ({ id })) },
  }

  if (isMovie) {
    createData.runtime = Number(data.runtime) ?? 0
    createData.type = 'movie'
    const created = await db.movie.create({ data: createData })
    // attach servers
    if (Array.isArray(data.servers)) {
      for (const s of data.servers) {
        const srv = await db.streamingServer.findUnique({ where: { id: s.serverId } })
        if (srv) {
          await db.movieServer.create({
            data: {
              movieId: created.id,
              serverId: srv.id,
              embedUrl: s.embedUrl,
              quality: s.quality ?? 'Auto',
              priority: Number(s.priority) ?? 0,
              status: s.status ?? 'active',
            },
          })
        }
      }
    }
    return NextResponse.json({ item: created })
  } else {
    createData.type = type === 'anime' ? 'anime' : 'series'
    const created = await db.series.create({ data: createData })
    return NextResponse.json({ item: created })
  }
}
