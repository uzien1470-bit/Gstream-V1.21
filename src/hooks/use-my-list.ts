'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { ContentType } from '@/lib/types'

export function useMyList(contentId: string, contentType: ContentType) {
  const [inList, setInList] = useState(false)
  const [loading, setLoading] = useState(true)

  const check = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/my-list/check?contentId=${contentId}&contentType=${contentType}`,
      )
      if (res.ok) {
        const data = await res.json()
        setInList(Boolean(data.inList))
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [contentId, contentType])

  useEffect(() => {
    check()
  }, [check])

  const toggle = useCallback(async () => {
    const res = await fetch('/api/my-list/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, contentType }),
    })
    if (res.ok) {
      const data = await res.json()
      setInList(data.inList)
      toast.success(data.inList ? 'Added to My List' : 'Removed from My List')
    } else if (res.status === 401) {
      toast.error('Please sign in to use My List')
    } else {
      toast.error('Something went wrong')
    }
  }, [contentId, contentType])

  return { inList, loading, toggle }
}
