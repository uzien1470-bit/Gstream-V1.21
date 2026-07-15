/**
 * Gstream data-access layer.
 *
 * All catalogue reads go through here. Uses @supabase/supabase-js (the server
 * anon client — public RLS allows reading published catalogue). Every query
 * is wrapped so that if Supabase is unreachable or unconfigured the functions
 * resolve to empty results instead of throwing — the public site always loads.
 */
import { createServerSupabaseClient } from '@/lib/supabase'
import type {
  ContentCardData,
  ContentDetail,
  ContentType,
  EpisodeData,
  SeasonData,
  ServerOption,
  CastMember,
  ActorCard,
  ActorDetail,
} from '@/lib/types'
import type { HeroSlide } from '@/components/content/hero-banner'

function parseCast(castJson: unknown): CastMember[] {
  if (typeof castJson !== 'string') return []
  try {
    const parsed = JSON.parse(castJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Build a CastMember[] from the relational Actor junction rows
 * (MovieActor/SeriesActor with nested actor:Actor). Falls back to
 * parseCast(jsonCast) if the junction rows are empty (legacy data).
 */
function buildCastFromActors(actorRows: any, jsonCast?: string): CastMember[] {
  if (Array.isArray(actorRows) && actorRows.length > 0) {
    return actorRows
      .slice()
      .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((r: any): CastMember => ({
        name: r.actor?.name ?? 'Unknown',
        role: r.characterName ?? '',
        image: r.actor?.profilePhotoUrl ?? undefined,
        actorId: r.actor?.id,
        actorSlug: r.actor?.slug,
      }))
  }
  // Fallback to legacy JSON cast if no relational actors found
  return parseCast(jsonCast)
}

function sortServers(servers: ServerOption[]): ServerOption[] {
  return [...servers].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1
    return b.priority - a.priority
  })
}

// ──────────────────────────── Row → card mappers ────────────────────────────

interface MovieRow {
  id: string; title: string; slug: string; synopsis: string
  posterUrl: string; backdropUrl: string; logoUrl: string | null
  releaseYear: number; rating: number; runtime: number
  trending?: boolean; popular?: boolean; topRated?: boolean; recentlyAdded?: boolean
  genres?: { name: string }[]
}

interface SeriesRow {
  id: string; title: string; slug: string; synopsis: string
  posterUrl: string; backdropUrl: string; logoUrl: string | null
  releaseYear: number; rating: number; type: string
  trending?: boolean; popular?: boolean; topRated?: boolean; recentlyAdded?: boolean
  genres?: { name: string }[]
}

export function movieToCard(m: MovieRow): ContentCardData {
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
    genres: (m.genres ?? []).map((g) => g.name),
    trending: m.trending,
    popular: m.popular,
    topRated: m.topRated,
    recentlyAdded: m.recentlyAdded,
  }
}

export function seriesToCard(s: SeriesRow): ContentCardData {
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
    genres: (s.genres ?? []).map((g) => g.name),
    trending: s.trending,
    popular: s.popular,
    topRated: s.topRated,
    recentlyAdded: s.recentlyAdded,
  }
}

// ──────────────────────────── Public catalogue queries ────────────────────────────

export async function getGenres(): Promise<{ name: string; slug: string }[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('Genre')
      .select('name, slug')
      .order('name', { ascending: true })
    if (error || !data) return []
    return data as { name: string; slug: string }[]
  } catch {
    return []
  }
}

interface MovieCardOpts {
  trending?: boolean; popular?: boolean; topRated?: boolean
  recentlyAdded?: boolean; featured?: boolean
  limit?: number; categorySlug?: string; genreSlug?: string
}

export async function getMovieCards(opts: MovieCardOpts = {}): Promise<ContentCardData[]> {
  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('Movie')
      .select('id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, runtime, trending, popular, topRated, recentlyAdded, genres:Genre!Movie_genres(name)')
      .eq('status', 'published')
    if (opts.trending) query = query.eq('trending', true)
    if (opts.popular) query = query.eq('popular', true)
    if (opts.topRated) query = query.order('rating', { ascending: false })
    if (opts.recentlyAdded) query = query.order('createdAt', { ascending: false })
    if (opts.featured) query = query.eq('featured', true)
    if (opts.genreSlug) query = query.filter('genres.slug', 'eq', opts.genreSlug)
    if (!opts.topRated && !opts.recentlyAdded) query = query.order('voteCount', { ascending: false })
    query = query.limit(opts.limit ?? 20)
    const { data, error } = await query
    if (error || !data) return []
    return (data as MovieRow[]).map(movieToCard)
  } catch {
    return []
  }
}

interface SeriesCardOpts {
  type?: 'series' | 'anime'
  trending?: boolean; popular?: boolean; topRated?: boolean
  recentlyAdded?: boolean; featured?: boolean
  limit?: number; categorySlug?: string; genreSlug?: string
}

export async function getSeriesCards(opts: SeriesCardOpts = {}): Promise<ContentCardData[]> {
  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('Series')
      .select('id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, type, trending, popular, topRated, recentlyAdded, genres:Genre!Series_genres(name)')
      .eq('status', 'published')
    if (opts.type) query = query.eq('type', opts.type)
    if (opts.trending) query = query.eq('trending', true)
    if (opts.popular) query = query.eq('popular', true)
    if (opts.topRated) query = query.order('rating', { ascending: false })
    if (opts.recentlyAdded) query = query.order('createdAt', { ascending: false })
    if (opts.featured) query = query.eq('featured', true)
    if (opts.genreSlug) query = query.filter('genres.slug', 'eq', opts.genreSlug)
    if (!opts.topRated && !opts.recentlyAdded) query = query.order('voteCount', { ascending: false })
    query = query.limit(opts.limit ?? 20)
    const { data, error } = await query
    if (error || !data) return []
    return (data as SeriesRow[]).map(seriesToCard)
  } catch {
    return []
  }
}

// ──────────────────────────── Detail ────────────────────────────

export async function getMovieDetail(id: string): Promise<ContentDetail | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('Movie')
      .select('*, genres:Genre!Movie_genres(name), categories:Category!Movie_categories(name), servers:MovieServer(*, server:StreamingServer(*)), actors:MovieActor(*, actor:Actor(*))')
      .eq('id', id)
      .single()
    if (error || !data) return null
    const m = data as any
    const servers: ServerOption[] = (m.servers ?? [])
      .filter((ms: any) => ms.server?.status === 'active' && ms.status === 'active')
      .map((ms: any) => ({
        id: ms.id,
        name: ms.server.name,
        embedUrl: ms.embedUrl,
        quality: ms.quality,
        priority: ms.priority,
        status: ms.status,
      }))
    // Build cast from relational Actor junction, falling back to JSON cast
    const cast = buildCastFromActors(m.actors)
    return {
      id: m.id, title: m.title, slug: m.slug, type: 'movie',
      synopsis: m.synopsis, posterUrl: m.posterUrl, backdropUrl: m.backdropUrl,
      logoUrl: m.logoUrl, releaseYear: m.releaseYear, rating: m.rating,
      voteCount: m.voteCount, runtime: m.runtime, trailerUrl: m.trailerUrl,
      genres: (m.genres ?? []).map((g: any) => g.name),
      categories: (m.categories ?? []).map((c: any) => c.name),
      cast, servers: sortServers(servers), seasons: [],
      featured: m.featured, trending: m.trending, popular: m.popular, topRated: m.topRated,
    }
  } catch {
    return null
  }
}

export async function getSeriesDetail(id: string): Promise<ContentDetail | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('Series')
      .select('*, genres:Genre!Series_genres(name), categories:Category!Series_categories(name), seasons:Season(*, episodes:Episode(*, servers:EpisodeServer(*, server:StreamingServer(*)))), actors:SeriesActor(*, actor:Actor(*))')
      .eq('id', id)
      .single()
    if (error || !data) return null
    const s = data as any
    const seasons: SeasonData[] = (s.seasons ?? [])
      .slice()
      .sort((a: any, b: any) => a.seasonNumber - b.seasonNumber)
      .map((season: any) => ({
        id: season.id,
        seasonNumber: season.seasonNumber,
        title: season.title,
        description: season.description,
        posterUrl: season.posterUrl,
        episodes: (season.episodes ?? [])
          .slice()
          .sort((a: any, b: any) => a.episodeNumber - b.episodeNumber)
          .map((ep: any): EpisodeData => ({
            id: ep.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            description: ep.description,
            thumbnailUrl: ep.thumbnailUrl,
            runtime: ep.runtime,
            airDate: ep.airDate,
            servers: sortServers(
              (ep.servers ?? [])
                .filter((es: any) => es.server?.status === 'active' && es.status === 'active')
                .map((es: any): ServerOption => ({
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
      id: s.id, title: s.title, slug: s.slug,
      type: s.type === 'anime' ? 'anime' : 'series',
      synopsis: s.synopsis, posterUrl: s.posterUrl, backdropUrl: s.backdropUrl,
      logoUrl: s.logoUrl, releaseYear: s.releaseYear, rating: s.rating,
      voteCount: s.voteCount, runtime: 0, trailerUrl: s.trailerUrl,
      genres: (s.genres ?? []).map((g: any) => g.name),
      categories: (s.categories ?? []).map((c: any) => c.name),
      cast: buildCastFromActors(s.actors), servers: [], seasons,
      featured: s.featured, trending: s.trending, popular: s.popular, topRated: s.topRated,
    }
  } catch {
    return null
  }
}

export async function getDetail(type: ContentType, id: string): Promise<ContentDetail | null> {
  if (type === 'movie') return getMovieDetail(id)
  return getSeriesDetail(id)
}

// ──────────────────────────── Recommendations ────────────────────────────

export async function getRecommendations(
  type: ContentType,
  id: string,
  limit = 12,
): Promise<ContentCardData[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const table = type === 'movie' ? 'Movie' : 'Series'
    const genreHint = type === 'movie' ? 'genres:Genre!Movie_genres(name)' : 'genres:Genre!Series_genres(name)'
    const { data: item, error: itemErr } = await supabase
      .from(table)
      .select(genreHint)
      .eq('id', id)
      .single()
    if (itemErr) {
      console.error('[content.getRecommendations] genre fetch failed:', itemErr.message)
      return []
    }
    const genreNames: string[] = ((item as any)?.genres ?? []).map((g: any) => g.name)
    if (genreNames.length === 0) return []

    const [moviesRes, seriesRes] = await Promise.all([
      supabase
        .from('Movie')
        .select('id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, runtime, trending, popular, topRated, recentlyAdded, genres:Genre!Movie_genres(name)')
        .neq('id', id)
        .eq('status', 'published')
        .filter('genres.name', 'in', `(${genreNames.join(',')})`)
        .order('rating', { ascending: false })
        .limit(limit),
      supabase
        .from('Series')
        .select('id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, type, trending, popular, topRated, recentlyAdded, genres:Genre!Series_genres(name)')
        .neq('id', id)
        .eq('status', 'published')
        .filter('genres.name', 'in', `(${genreNames.join(',')})`)
        .order('rating', { ascending: false })
        .limit(limit),
    ])
    const movies = (moviesRes.data ?? []) as MovieRow[]
    const series = (seriesRes.data ?? []) as SeriesRow[]
    return [...movies.map(movieToCard), ...series.map(seriesToCard)].slice(0, limit)
  } catch {
    return []
  }
}

// ──────────────────────────── Search ────────────────────────────

export async function searchContent(
  query: string,
  filters?: { type?: ContentType | 'all'; genre?: string; year?: number },
): Promise<ContentCardData[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const q = query.trim()
    const isYear = /^\d{4}$/.test(q)

    const movieSelect = 'id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, runtime, trending, popular, topRated, recentlyAdded, genres:Genre!Movie_genres(name)'
    const seriesSelect = 'id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, type, trending, popular, topRated, recentlyAdded, genres:Genre!Series_genres(name)'

    const tasks: Promise<ContentCardData[]>[] = []

    if (!filters?.type || filters.type === 'all' || filters.type === 'movie') {
      let mq = supabase.from('Movie').select(movieSelect).eq('status', 'published')
      if (q && !isYear) {
        mq = mq.or(`title.ilike.%${q}%,synopsis.ilike.%${q}%,cast.ilike.%${q}%`)
      }
      if (isYear) mq = mq.eq('releaseYear', Number(q))
      if (filters?.year) mq = mq.eq('releaseYear', filters.year)
      if (filters?.genre) mq = mq.filter('genres.slug', 'eq', filters.genre)
      tasks.push(mq.order('voteCount', { ascending: false }).limit(40)
        .then(({ data }) => ((data as MovieRow[]) ?? []).map(movieToCard)))
    }
    if (!filters?.type || filters.type === 'all' || filters.type === 'series' || filters.type === 'anime') {
      let sq = supabase.from('Series').select(seriesSelect).eq('status', 'published')
      if (filters?.type === 'series' || filters?.type === 'anime') sq = sq.eq('type', filters.type)
      if (q && !isYear) {
        sq = sq.or(`title.ilike.%${q}%,synopsis.ilike.%${q}%,cast.ilike.%${q}%`)
      }
      if (isYear) sq = sq.eq('releaseYear', Number(q))
      if (filters?.year) sq = sq.eq('releaseYear', filters.year)
      if (filters?.genre) sq = sq.filter('genres.slug', 'eq', filters.genre)
      tasks.push(sq.order('voteCount', { ascending: false }).limit(40)
        .then(({ data }) => ((data as SeriesRow[]) ?? []).map(seriesToCard)))
    }

    const results = (await Promise.all(tasks)).flat()
    return results
  } catch {
    return []
  }
}

// ──────────────────────────── Continue watching ────────────────────────────

export async function getContinueWatching(userId: string): Promise<
  (ContentCardData & { progress: number; episodeId?: string | null })[]
> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('WatchProgress')
      .select('id, movieId, seriesId, episodeId, contentType, progress, updatedAt')
      .eq('userId', userId)
      .lt('progress', 95)
      .order('updatedAt', { ascending: false })
      .limit(20)
    if (!data) return []
    const items: (ContentCardData & { progress: number; episodeId?: string | null })[] = []
    for (const p of data as any[]) {
      if (p.movieId) {
        const { data: m } = await supabase
          .from('Movie')
          .select('id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, runtime, trending, popular, topRated, recentlyAdded, genres:Genre!Movie_genres(name)')
          .eq('id', p.movieId)
          .single()
        if (m) items.push({ ...movieToCard(m as MovieRow), progress: p.progress, episodeId: null })
      } else if (p.seriesId) {
        const { data: s } = await supabase
          .from('Series')
          .select('id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, type, trending, popular, topRated, recentlyAdded, genres:Genre!Series_genres(name)')
          .eq('id', p.seriesId)
          .single()
        if (s) items.push({ ...seriesToCard(s as SeriesRow), progress: p.progress, episodeId: p.episodeId })
      }
    }
    return items
  } catch {
    return []
  }
}

// ──────────────────────────── Home page aggregator ────────────────────────────

export async function getHomeData() {
  try {
    const [
      featuredMovies, featuredSeries,
      trending, recentlyAddedMovies, recentlyAddedSeries,
      popularMovies, popularSeries, popularAnime,
      topRated, recommended, recentlyUpdated,
    ] = await Promise.all([
      (async () => {
        const supabase = await createServerSupabaseClient()
        const { data } = await supabase
          .from('Movie')
          .select('id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, runtime, trending, popular, topRated, recentlyAdded, genres:Genre!Movie_genres(name)')
          .eq('featured', true)
          .eq('status', 'published')
          .limit(3)
        return (data ?? []) as MovieRow[]
      })(),
      (async () => {
        const supabase = await createServerSupabaseClient()
        const { data } = await supabase
          .from('Series')
          .select('id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, type, trending, popular, topRated, recentlyAdded, genres:Genre!Series_genres(name)')
          .eq('featured', true)
          .eq('status', 'published')
          .limit(4)
        return (data ?? []) as SeriesRow[]
      })(),
      Promise.all([
        getMovieCards({ trending: true, limit: 20 }),
        getSeriesCards({ trending: true, limit: 20 }),
      ]).then(([a, b]) => [...a, ...b]),
      getMovieCards({ recentlyAdded: true, limit: 20 }),
      getSeriesCards({ recentlyAdded: true, limit: 20 }),
      getMovieCards({ popular: true, limit: 20 }),
      getSeriesCards({ type: 'series', popular: true, limit: 20 }),
      getSeriesCards({ type: 'anime', popular: true, limit: 20 }),
      Promise.all([
        getMovieCards({ topRated: true, limit: 12 }),
        getSeriesCards({ topRated: true, limit: 12 }),
      ]).then(([a, b]) => [...a, ...b].sort((x, y) => y.rating - x.rating)),
      Promise.all([
        getMovieCards({ limit: 12 }),
        getSeriesCards({ limit: 12 }),
      ]).then(([a, b]) => [...a, ...b].sort(() => Math.random() - 0.5)),
      Promise.all([
        getMovieCards({ recentlyAdded: true, limit: 20 }),
        getSeriesCards({ recentlyAdded: true, limit: 20 }),
      ]).then(([a, b]) => [...a, ...b]),
    ])

    const heroSlides: HeroSlide[] = [
      ...featuredMovies.map((m) => ({
        ...movieToCard(m),
        synopsis: m.synopsis,
        logoUrl: m.logoUrl,
      })),
      ...featuredSeries.map((s) => ({
        ...seriesToCard(s),
        synopsis: s.synopsis,
        logoUrl: s.logoUrl,
      })),
    ].slice(0, 5)

    return {
      heroSlides,
      trending,
      recentlyAdded: [...recentlyAddedMovies, ...recentlyAddedSeries],
      popularMovies,
      popularSeries,
      popularAnime,
      topRated,
      recommended,
      recentlyUpdated,
    }
  } catch {
    return {
      heroSlides: [],
      trending: [],
      recentlyAdded: [],
      popularMovies: [],
      popularSeries: [],
      popularAnime: [],
      topRated: [],
      recommended: [],
      recentlyUpdated: [],
    }
  }
}

// ──────────────────────────── Actor queries ────────────────────────────

/** Fetch a single actor by slug with their full filmography. */
export async function getActorDetail(slug: string): Promise<ActorDetail | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: actor, error } = await supabase
      .from('Actor')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    if (error || !actor) return null
    const a = actor as any

    // Fetch filmography: movies + series via junction tables
    const [moviesRes, seriesRes] = await Promise.all([
      supabase
        .from('MovieActor')
        .select('movieId, characterName, movie:Movie(id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, runtime, type, trending, popular, topRated, recentlyAdded, status, genres:Genre!Movie_genres(name))')
        .eq('actorId', a.id)
        .order('displayOrder', { ascending: true }),
      supabase
        .from('SeriesActor')
        .select('seriesId, characterName, series:Series(id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, type, trending, popular, topRated, recentlyAdded, status, genres:Genre!Series_genres(name))')
        .eq('actorId', a.id)
        .order('displayOrder', { ascending: true }),
    ])

    const filmography: ContentCardData[] = []
    for (const r of (moviesRes.data ?? []) as any[]) {
      if (r.movie && r.movie.status === 'published') {
        filmography.push(movieToCard(r.movie, r.movie.genres))
      }
    }
    for (const r of (seriesRes.data ?? []) as any[]) {
      if (r.series && r.series.status === 'published') {
        filmography.push(seriesToCard(r.series, r.series.genres))
      }
    }

    return {
      id: a.id,
      name: a.name,
      slug: a.slug,
      profilePhotoUrl: a.profilePhotoUrl,
      heroPhotoUrl: a.heroPhotoUrl,
      biography: a.biography,
      birthday: a.birthday,
      birthPlace: a.birthPlace,
      nationality: a.nationality,
      status: a.status,
      filmography,
    }
  } catch {
    return null
  }
}

/** Search actors by name (for global search + admin actor selector). */
export async function searchActors(query: string, limit = 10): Promise<ActorCard[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const q = query.trim()
    if (!q) return []
    const { data, error } = await supabase
      .from('Actor')
      .select('id, name, slug, profilePhotoUrl')
      .or(`name.ilike.%${q}%`)
      .eq('status', 'published')
      .order('name', { ascending: true })
      .limit(limit)
    if (error || !data) return []
    return data as ActorCard[]
  } catch {
    return []
  }
}
