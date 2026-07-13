import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ListingGrid } from '@/components/content/listing-grid'
import { getSeriesCards, getGenres } from '@/lib/content'

export const metadata = { title: 'Anime — Gstream' }

export default async function AnimePage() {
  const [anime, genres] = await Promise.all([
    getSeriesCards({ type: 'anime', limit: 100 }),
    getGenres(),
  ])

  return (
    <AppShell>
      <PageHeader
        title="Anime"
        subtitle="From legendary sagas to the freshest seasonal hits — dive into the anime universe."
      />
      <div className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-10">
        <ListingGrid items={anime} genres={genres} />
      </div>
    </AppShell>
  )
}
