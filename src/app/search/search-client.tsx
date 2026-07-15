'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search as SearchIcon, X, Film, Tv, Sparkles, Filter, UserCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { ContentCard, ContentCardSkeleton } from '@/components/content/content-card'
import { cn } from '@/lib/utils'
import type { ContentCardData, ContentType } from '@/lib/types'

interface ActorResult {
  id: string
  name: string
  slug: string
  profilePhotoUrl: string | null
}

const TYPE_TABS: { value: ContentType | 'all'; label: string; icon: any }[] = [
  { value: 'all', label: 'All', icon: Filter },
  { value: 'movie', label: 'Movies', icon: Film },
  { value: 'series', label: 'Series', icon: Tv },
  { value: 'anime', label: 'Anime', icon: Sparkles },
]

export function SearchClient() {
  const params = useSearchParams()
  const initialQ = params.get('q') ?? ''
  const [query, setQuery] = useState(initialQ)
  const [type, setType] = useState<ContentType | 'all'>('all')
  const [genre, setGenre] = useState('all')
  const [year, setYear] = useState<string>('')
  const [results, setResults] = useState<ContentCardData[]>([])
  const [actorResults, setActorResults] = useState<ActorResult[]>([])
  const [genres, setGenres] = useState<{ name: string; slug: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [years, setYears] = useState<number[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/genres').then((r) => r.json()).then((d) => setGenres(d.genres ?? [])).catch(() => {})
    const now = new Date().getFullYear()
    setYears(Array.from({ length: now - 1960 + 1 }, (_, i) => now - i))
  }, [])

  useEffect(() => {
    setQuery(initialQ)
  }, [initialQ])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const urlQuery = query.trim()
    const url = new URL(window.location.href)
    if (urlQuery) url.searchParams.set('q', urlQuery)
    else url.searchParams.delete('q')
    window.history.replaceState({}, '', url.toString())

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const u = new URL('/api/search', window.location.origin)
        if (urlQuery) u.searchParams.set('q', urlQuery)
        u.searchParams.set('type', type)
        if (genre !== 'all') u.searchParams.set('genre', genre)
        if (year) u.searchParams.set('year', year)
        const res = await fetch(u.toString())
        const data = await res.json()
        setResults(data.items ?? [])
        setActorResults(data.actors ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, type, genre, year])

  return (
    <>
      <PageHeader
        title="Search"
        subtitle="Find movies, series and anime by title, genre, actor or year."
      />
      <div className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-10">
        {/* Search input */}
        <div className="relative mb-6">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for titles, genres, actors, years..."
            className="h-14 w-full rounded-2xl border border-border bg-card/60 pl-12 pr-12 text-base outline-none transition-colors focus:border-primary"
            autoFocus
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-card/60 p-1">
            {TYPE_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  type === t.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="h-9 rounded-full border border-border bg-card/60 px-4 text-sm outline-none focus:border-primary"
          >
            <option value="all">All Genres</option>
            {genres.map((g) => (
              <option key={g.slug} value={g.slug}>{g.name}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-9 rounded-full border border-border bg-card/60 px-4 text-sm outline-none focus:border-primary"
          >
            <option value="">Any Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        <div className="mb-4 text-sm text-muted-foreground">
          {loading ? 'Searching...' : `${results.length} result${results.length === 1 ? '' : 's'}${actorResults.length > 0 ? ` · ${actorResults.length} actor${actorResults.length === 1 ? '' : 's'}` : ''}`}
        </div>

        {/* Actor results */}
        {!loading && actorResults.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <UserCircle className="h-4 w-4" /> Actors
            </h3>
            <div className="flex flex-wrap gap-3">
              {actorResults.map((a) => (
                <Link
                  key={a.id}
                  href={`/actors/${a.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3 transition-colors hover:border-primary/50"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary">
                    {a.profilePhotoUrl ? (
                      <img src={a.profilePhotoUrl} alt={a.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-lg font-bold text-muted-foreground">
                        {a.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{a.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => <ContentCardSkeleton key={i} />)}
          </div>
        ) : results.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border py-24 text-center">
            <SearchIcon className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-semibold">No results found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different keyword or filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((item) => (
              <ContentCard key={`${item.type}-${item.id}`} item={item} className="w-full" />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
