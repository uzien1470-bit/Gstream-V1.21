import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ListingGrid } from '@/components/content/listing-grid'
import { getMovieCards, getGenres } from '@/lib/content'

export const metadata = { title: 'Movies — Gstream' }

export default async function MoviesPage() {
  const [movies, genres] = await Promise.all([
    getMovieCards({ limit: 100 }),
    getGenres(),
  ])

  return (
    <AppShell>
      <PageHeader
        title="Movies"
        subtitle="A curated cinematic collection — from timeless classics to the latest blockbusters."
      />
      <div className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-10">
        <ListingGrid items={movies} genres={genres} />
      </div>
    </AppShell>
  )
}
