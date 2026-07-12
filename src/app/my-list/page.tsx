'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/layout/page-header'
import { ContentCard, ContentCardSkeleton } from '@/components/content/content-card'
import { Button } from '@/components/ui/button'
import type { ContentCardData } from '@/lib/types'

export default function MyListPage() {
  const [items, setItems] = useState<ContentCardData[] | null>(null)

  useEffect(() => {
    fetch('/api/my-list/list')
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
  }, [])

  return (
    <AppShell>
      <PageHeader
        title="My List"
        subtitle="Your hand-picked collection of titles to watch later."
      />
      <div className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-10">
        {items === null ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => <ContentCardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-24 text-center">
            <Bookmark className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-semibold">Your list is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse and add titles to watch them later.
            </p>
            <Button asChild className="mt-4">
              <Link href="/movies">Discover Movies</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item) => (
              <ContentCard key={`${item.type}-${item.id}`} item={item} className="w-full" />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
