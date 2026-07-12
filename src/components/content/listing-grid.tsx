'use client'

import { useState, useMemo } from 'react'
import { ContentCard } from './content-card'
import type { ContentCardData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ListingGridProps {
  items: ContentCardData[]
  genres: { name: string; slug: string }[]
  initialGenre?: string
  initialSort?: string
}

export function ListingGrid({ items, genres, initialGenre, initialSort }: ListingGridProps) {
  const [genre, setGenre] = useState(initialGenre ?? 'all')
  const [sort, setSort] = useState(initialSort ?? 'trending')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let list = [...items]
    if (genre !== 'all') {
      list = list.filter((i) => i.genres.includes(genre))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.genres.some((g) => g.toLowerCase().includes(q)),
      )
    }
    switch (sort) {
      case 'rating':
        list.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        list.sort((a, b) => b.releaseYear - a.releaseYear)
        break
      case 'title':
        list.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        // trending default — keep voteCount-ish order (already roughly there)
        break
    }
    return list
  }, [items, genre, sort, query])

  return (
    <div>
      {/* Controls */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setGenre('all')}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              genre === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g.slug}
              onClick={() => setGenre(g.name)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                genre === g.name
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title..."
            className="h-9 w-full rounded-full border border-border bg-card/60 px-4 text-sm outline-none focus:border-primary lg:w-56"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-full border border-border bg-card/60 px-3 text-sm outline-none focus:border-primary"
          >
            <option value="trending">Trending</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
            <option value="title">A–Z</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border py-24 text-center">
          <p className="text-lg font-semibold">No titles found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different genre or filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((item) => (
            <ContentCard
              key={`${item.type}-${item.id}`}
              item={item}
              className="w-full"
            />
          ))}
        </div>
      )}
    </div>
  )
}
