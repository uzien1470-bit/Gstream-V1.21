import { Suspense } from 'react'
import { EpisodesClient } from './episodes-client'

export default function AdminEpisodesPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-muted-foreground">Loading...</div>}>
      <EpisodesClient />
    </Suspense>
  )
}
