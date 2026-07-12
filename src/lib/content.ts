import { db } from '@/lib/db'
import type {
  ContentCardData,
  ContentDetail,
  ContentType,
  EpisodeData,
  SeasonData,
  ServerOption,
  CastMember,
} from '@/lib/types'
import type { Movie, Series, Episode, Season } from '@prisma/client'

function parseCast(castJson: string): CastMember[] {
  try {
    const parsed = JSON.parse(castJson)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

function sortServers(servers: ServerOption[]): ServerOption[] {
  return [...servers].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1
    return b.priority - a.priority
  })
}

export function movieToCard(m: Movie, genres: { name: string }[] = []): ContentCardData {
  return {
    id: m.id,
    title: m.title,
    slug: m.slug,
    type: 'movie',
    posterUrl: m.posterUrl,
    backdropUrl: m.backdropUrl,
    logoUrl: m.logoUrl,
    releaseYear: m.releaseYear,
    rating: m.rating,
    runtime: m.runtime,
    synopsis: m.synopsis,
    genres: genres.map((g) => g.name),
    trending: m.trending,
    popular: m.popular,
    topRated: m.topRated,
    recentlyAdded: m.recentlyAdded,
  }
}

export function seriesToCard(s: Series, genres: { name: string }[] = []): ContentCardData {
  return {
    id: s.id,
    title: s.title,
    slug: s.slug,
    type: s.type === 'anime' ? 'anime' : 'series',
    posterUrl: s.posterUrl,
    backdropUrl: s.backdropUrl,
    logoUrl: s.logoUrl,
    releaseYear: s.releaseYear,
    rating: s.rating,
    synopsis: s.synopsis,
    genres: genres.map((g) => g.name),
    trending: s.trending,
    popular: s.popular,
    topRated: s.topRated,
    recentlyAdded: s.recentlyAdded,
  }
}

async function loadGenresForMovie(movieId: string): Promise<{ name: string }[]> {
  const m = await db.movie.findUnique({
    where: { id: movieId },
    select: { genres: { select: { name: true } } },
  })
  return m?.genres ?? []
}

async function loadGenresForSeries(seriesId: string): Promise<{ name: string }[]> {
  const s = await db.series.findUnique({
    where: { id: seriesId },
    select: { genres: { select: { name: true } } },
  })
  return s?.genres ?? []
}

export async function getMovieCards(opts: {
  trending?: boolean
  popular?: boolean
  topRated?: boolean
  recentlyAdded?: boolean
  featured?: boolean
  limit?: number
  categorySlug?: string
  genreSlug?: string
}): Promise<ContentCardData[]> {
  const where: any = { status: 'published' }
  if (opts.trending) where.trending = true
  if (opts.popular) where.popular = true
  if (opts.topRated) where.topRated = true
  if (opts.recentlyAdded) where.recentlyAdded = true
  if (opts.featured) where.featured = true
  if (opts.categorySlug) where.categories = { some: { slug: opts.categorySlug } }
  if (opts.genreSlug) where.genres = { some: { slug: opts.genreSlug } }

  const movies = await db.movie.findMany({
    where,
    orderBy: opts.topRated
      ? { rating: 'desc' }
      : opts.recentlyAdded
        ? { createdAt: 'desc' }
        : { voteCount: 'desc' },
    take: opts.limit ?? 20,
    include: { genres: { select: { name: true } } },
  })
  return movies.map((m) => movieToCard(m, m.genres))
}

export async function getSeriesCards(opts: {
  type?: 'series' | 'anime'
  trending?: boolean
  popular?: boolean
  topRated?: boolean
  recentlyAdded?: boolean
  featured?: boolean
  limit?: number
  categorySlug?: string
  genreSlug?: string
}): Promise<ContentCardData[]> {
  const where: any = { status: 'published' }
  if (opts.type) where.type = opts.type
  if (opts.trending) where.trending = true
  if (opts.popular) where.popular = true
  if (opts.topRated) where.topRated = true
  if (opts.recentlyAdded) where.recentlyAdded = true
  if (opts.featured) where.featured = true
  if (opts.categorySlug) where.categories = { some: { slug: opts.categorySlug } }
  if (opts.genreSlug) where.genres = { some: { slug: opts.genreSlug } }

  const series = await db.series.findMany({
    where,
    orderBy: opts.topRated
      ? { rating: 'desc' }
      : opts.recentlyAdded
        ? { createdAt: 'desc' }
        : { voteCount: 'desc' },
    take: opts.limit ?? 20,
    include: { genres: { select: { name: true } } },
  })
  return series.map((s) => seriesToCard(s, s.genres))
}

export async function getMovieDetail(id: string): Promise<ContentDetail | null> {
  const movie = await db.movie.findUnique({
    where: { id },
    include: {
      genres: true,
      categories: true,
      servers: {
        include: { server: true },
        where: { status: 'active' },
      },
    },
  })
  if (!movie) return null

  const servers: ServerOption[] = movie.servers
    .filter((ms) => ms.server.status === 'active')
    .map((ms) => ({
      id: ms.id,
      name: ms.server.name,
      embedUrl: ms.embedUrl,
      quality: ms.quality,
      priority: ms.priority,
      status: ms.status,
    }))

  return {
    id: movie.id,
    title: movie.title,
    slug: movie.slug,
    type: 'movie',
    synopsis: movie.synopsis,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    logoUrl: movie.logoUrl,
    releaseYear: movie.releaseYear,
    rating: movie.rating,
    voteCount: movie.voteCount,
    runtime: movie.runtime,
    trailerUrl: movie.trailerUrl,
    genres: movie.genres.map((g) => g.name),
    categories: movie.categories.map((c) => c.name),
    cast: parseCast(movie.cast),
    servers: sortServers(servers),
    seasons: [],
    featured: movie.featured,
    trending: movie.trending,
    popular: movie.popular,
    topRated: movie.topRated,
  }
}

export async function getSeriesDetail(id: string): Promise<ContentDetail | null> {
  const series = await db.series.findUnique({
    where: { id },
    include: {
      genres: true,
      categories: true,
      seasons: {
        orderBy: { seasonNumber: 'asc' },
        include: {
          episodes: {
            orderBy: { episodeNumber: 'asc' },
            include: {
              servers: {
                include: { server: true },
                where: { status: 'active' },
              },
            },
          },
        },
      },
    },
  })
  if (!series) return null

  const seasons: SeasonData[] = series.seasons.map((season: Season) => ({
    id: season.id,
    seasonNumber: season.seasonNumber,
    title: season.title,
    description: season.description,
    posterUrl: season.posterUrl,
    episodes: season.episodes.map((ep: Episode) => ({
      id: ep.id,
      episodeNumber: ep.episodeNumber,
      title: ep.title,
      description: ep.description,
      thumbnailUrl: ep.thumbnailUrl,
      runtime: ep.runtime,
      airDate: ep.airDate,
      servers: sortServers(
        ep.servers
          .filter((es) => es.server.status === 'active')
          .map((es) => ({
            id: es.id,
            name: es.server.name,
            embedUrl: es.embedUrl,
            quality: es.quality,
            priority: es.priority,
            status: es.status,
          })),
      ),
    })),
  }))

  return {
    id: series.id,
    title: series.title,
    slug: series.slug,
    type: series.type === 'anime' ? 'anime' : 'series',
    synopsis: series.synopsis,
    posterUrl: series.posterUrl,
    backdropUrl: series.backdropUrl,
    logoUrl: series.logoUrl,
    releaseYear: series.releaseYear,
    rating: series.rating,
    voteCount: series.voteCount,
    runtime: 0,
    trailerUrl: series.trailerUrl,
    genres: series.genres.map((g) => g.name),
    categories: series.categories.map((c) => c.name),
    cast: parseCast(series.cast),
    servers: [],
    seasons,
    featured: series.featured,
    trending: series.trending,
    popular: series.popular,
    topRated: series.topRated,
  }
}

export async function getDetail(
  type: ContentType,
  id: string,
): Promise<ContentDetail | null> {
  if (type === 'movie') return getMovieDetail(id)
  return getSeriesDetail(id)
}

export async function getRecommendations(
  type: ContentType,
  id: string,
  limit = 12,
): Promise<ContentCardData[]> {
  // Find by shared genres
  let genreNames: string[] = []
  if (type === 'movie') {
    const m = await db.movie.findUnique({ where: { id }, include: { genres: true } })
    genreNames = m?.genres.map((g) => g.name) ?? []
  } else {
    const s = await db.series.findUnique({ where: { id }, include: { genres: true } })
    genreNames = s?.genres.map((g) => g.name) ?? []
  }
  if (genreNames.length === 0) return []

  const [movies, series] = await Promise.all([
    db.movie.findMany({
      where: {
        id: { not: id },
        status: 'published',
        genres: { some: { name: { in: genreNames } } },
      },
      take: limit,
      orderBy: { rating: 'desc' },
      include: { genres: { select: { name: true } } },
    }),
    db.series.findMany({
      where: {
        id: { not: id },
        status: 'published',
        genres: { some: { name: { in: genreNames } } },
      },
      take: limit,
      orderBy: { rating: 'desc' },
      include: { genres: { select: { name: true } } },
    }),
  ])
  return [...movies.map((m) => movieToCard(m, m.genres)), ...series.map((s) => seriesToCard(s, s.genres))].slice(0, limit)
}

export async function searchContent(query: string, filters?: {
  type?: ContentType | 'all'
  genre?: string
  year?: number
}): Promise<ContentCardData[]> {
  const q = query.trim()
  const movieWhere: any = { status: 'published' }
  const seriesWhere: any = { status: 'published' }

  if (q) {
    movieWhere.OR = [
      { title: { contains: q } },
      { synopsis: { contains: q } },
      { cast: { contains: q } },
    ]
    seriesWhere.OR = [
      { title: { contains: q } },
      { synopsis: { contains: q } },
      { cast: { contains: q } },
    ]
  }
  if (q.match(/^\d{4}$/)) {
    movieWhere.releaseYear = Number(q)
    seriesWhere.releaseYear = Number(q)
  }
  if (filters?.genre) {
    movieWhere.genres = { some: { slug: filters.genre } }
    seriesWhere.genres = { some: { slug: filters.genre } }
  }
  if (filters?.year) {
    movieWhere.releaseYear = filters.year
    seriesWhere.releaseYear = filters.year
  }

  const tasks: Promise<ContentCardData[]>[] = []
  if (!filters?.type || filters.type === 'all' || filters.type === 'movie') {
    tasks.push(
      db.movie.findMany({
        where: movieWhere,
        take: 40,
        orderBy: { voteCount: 'desc' },
        include: { genres: { select: { name: true } } },
      }).then((ms) => ms.map((m) => movieToCard(m, m.genres))),
    )
  }
  if (!filters?.type || filters.type === 'all' || filters.type === 'series' || filters.type === 'anime') {
    tasks.push(
      db.series.findMany({
        where: seriesWhere,
        take: 40,
        orderBy: { voteCount: 'desc' },
        include: { genres: { select: { name: true } } },
      }).then((ss) => ss.map((s) => seriesToCard(s, s.genres))),
    )
  }

  const results = (await Promise.all(tasks)).flat()
  return results
}

export async function getContinueWatching(userId: string): Promise<
  (ContentCardData & { progress: number; episodeId?: string | null })[]
> {
  const progress = await db.watchProgress.findMany({
    where: { userId, progress: { lt: 95 } },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })
  const items: (ContentCardData & { progress: number; episodeId?: string | null })[] = []
  for (const p of progress) {
    if (p.movieId) {
      const m = await db.movie.findUnique({
        where: { id: p.movieId },
        include: { genres: { select: { name: true } } },
      })
      if (m) items.push({ ...movieToCard(m, m.genres), progress: p.progress, episodeId: null })
    } else if (p.seriesId) {
      const s = await db.series.findUnique({
        where: { id: p.seriesId },
        include: { genres: { select: { name: true } } },
      })
      if (s) items.push({ ...seriesToCard(s, s.genres), progress: p.progress, episodeId: p.episodeId })
    }
  }
  return items
}
