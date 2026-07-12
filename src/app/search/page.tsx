import { Suspense } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { SearchClient } from './search-client'

export const metadata = { title: 'Search — Gstream' }

export default function SearchPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="pt-32 text-center text-muted-foreground">Loading search...</div>}>
        <SearchClient />
      </Suspense>
    </AppShell>
  )
}
