import { AppShell } from '@/components/layout/app-shell'
import { HeroBanner, type HeroSlide } from '@/components/content/hero-banner'
import { ContentRow } from '@/components/content/content-row'
import { ContinueWatchingRow } from '@/components/content/continue-watching-row'
import { SupabaseSetupScreen } from '@/components/supabase-setup-screen'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { getMovieCards, getSeriesCards } from '@/lib/content'
import { db } from '@/lib/db'

async function getHomeData() {
  const [
    featuredMovies, featuredSeries,
    trending, recentlyAddedMovies, recentlyAddedSeries,
    popularMovies, popularSeries, popularAnime,
    topRated, recommended, recentlyUpdated,
  ] = await Promise.all([
    db.movie.findMany({ where: { featured: true, status: 'published' }, take: 3, include: { genres: { select: { name: true } } } }),
    db.series.findMany({ where: { featured: true, status: 'published' }, take: 4, include: { genres: { select: { name: true } } } }),
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

  // Build hero slides from featured content
  const heroSlides: HeroSlide[] = [
    ...featuredMovies.map((m) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      type: 'movie' as const,
      posterUrl: m.posterUrl,
      backdropUrl: m.backdropUrl,
      logoUrl: m.logoUrl,
      releaseYear: m.releaseYear,
      rating: m.rating,
      runtime: m.runtime,
      synopsis: m.synopsis,
      genres: m.genres.map((g) => g.name),
      trending: m.trending,
      popular: m.popular,
      topRated: m.topRated,
      recentlyAdded: m.recentlyAdded,
    })),
    ...featuredSeries.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      type: (s.type === 'anime' ? 'anime' : 'series') as 'series' | 'anime',
      posterUrl: s.posterUrl,
      backdropUrl: s.backdropUrl,
      logoUrl: s.logoUrl,
      releaseYear: s.releaseYear,
      rating: s.rating,
      synopsis: s.synopsis,
      genres: s.genres.map((g) => g.name),
      trending: s.trending,
      popular: s.popular,
      topRated: s.topRated,
      recentlyAdded: s.recentlyAdded,
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
}

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseSetupScreen />
  }
  const data = await getHomeData()

  return (
    <AppShell>
      <HeroBanner slides={data.heroSlides} />

      <div className="relative z-10 -mt-8 space-y-10 pb-16 sm:-mt-12 lg:-mt-16">
        <ContinueWatchingRow />
        <ContentRow title="Trending Now" items={data.trending} />
        <ContentRow title="Recently Added" items={data.recentlyAdded} />
        <ContentRow title="Popular Movies" items={data.popularMovies} />
        <ContentRow title="Popular TV Series" items={data.popularSeries} />
        <ContentRow title="Popular Anime" items={data.popularAnime} />
        <ContentRow title="Top Rated" items={data.topRated} />
        <ContentRow title="Recommended For You" items={data.recommended} />
        <ContentRow title="Recently Updated" items={data.recentlyUpdated} />
      </div>
    </AppShell>
  )
}
