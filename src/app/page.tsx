import { AppShell } from '@/components/layout/app-shell'
import { HeroBanner } from '@/components/content/hero-banner'
import { ContentRow } from '@/components/content/content-row'
import { ContinueWatchingRow } from '@/components/content/continue-watching-row'
import { getHomeData } from '@/lib/content'

export default async function HomePage() {
  const data = await getHomeData()

  return (
    <AppShell>
      <HeroBanner slides={data.heroSlides} />

      <div className="relative z-10 -mt-8 space-y-10 pb-16 sm:-mt-12 lg:-mt-16">
        <ContinueWatchingRow />
        {data.trending.length > 0 && <ContentRow title="Trending Now" items={data.trending} />}
        {data.recentlyAdded.length > 0 && <ContentRow title="Recently Added" items={data.recentlyAdded} />}
        {data.popularMovies.length > 0 && <ContentRow title="Popular Movies" items={data.popularMovies} />}
        {data.popularSeries.length > 0 && <ContentRow title="Popular TV Series" items={data.popularSeries} />}
        {data.popularAnime.length > 0 && <ContentRow title="Popular Anime" items={data.popularAnime} />}
        {data.topRated.length > 0 && <ContentRow title="Top Rated" items={data.topRated} />}
        {data.recommended.length > 0 && <ContentRow title="Recommended For You" items={data.recommended} />}
        {data.recentlyUpdated.length > 0 && <ContentRow title="Recently Updated" items={data.recentlyUpdated} />}
      </div>
    </AppShell>
  )
}
