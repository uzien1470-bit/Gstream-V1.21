'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/hooks/use-session'
import { ContentRow } from './content-row'
import type { ContentCardData } from '@/lib/types'

type Item = ContentCardData & { progress: number; episodeId?: string | null }

export function ContinueWatchingRow() {
  const { user, loading } = useSession()
  const [items, setItems] = useState<Item[] | null>(null)

  useEffect(() => {
    if (loading || !user) return
    let cancelled = false
    fetch('/api/watch/continue')
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setItems(data.items ?? []) })
      .catch(() => { if (!cancelled) setItems([]) })
    return () => { cancelled = true }
  }, [user, loading])

  if (loading || items === null) return null
  if (items.length === 0) return null
  return <ContentRow title="Continue Watching" items={items} showProgress />
}
