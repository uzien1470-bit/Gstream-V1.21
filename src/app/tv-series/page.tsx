import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ListingGrid } from '@/components/content/listing-grid'
import { SupabaseSetupScreen } from '@/components/supabase-setup-screen'
import { isSupabaseConfigured } from '@/lib/supabase/configured'
import { getSeriesCards } from '@/lib/content'
import { db } from '@/lib/db'

export const metadata = { title: 'TV Series — Gstream' }

export default async function TvSeriesPage() {
  if (!isSupabaseConfigured()) return <SupabaseSetupScreen />
  const [series, genres] = await Promise.all([
    getSeriesCards({ type: 'series', limit: 100 }),
    db.genre.findMany({ orderBy: { name: 'asc' }, select: { name: true, slug: true } }),
  ])

  return (
    <AppShell>
      <PageHeader
        title="TV Series"
        subtitle="Binge-worthy stories told across seasons — drama, mystery, and worlds worth getting lost in."
      />
      <div className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-10">
        <ListingGrid items={series} genres={genres} />
      </div>
    </AppShell>
  )
}
