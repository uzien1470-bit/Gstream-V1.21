'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Star, Calendar, Clock, Plus, Check, Play, Film,
  Tv, Sparkles, Bookmark, Share2, ChevronLeft, ChevronRight, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { EmbedPlayer } from '@/components/watch/embed-player'
import { EpisodeSelector } from '@/components/watch/episode-selector'
import { ContentCard } from '@/components/content/content-card'
import { SmartImage } from '@/components/content/smart-image'
import { BrandMark } from '@/components/layout/brand-mark'
import { useMyList } from '@/hooks/use-my-list'
import { useSession } from '@/hooks/use-session'
import { toast } from 'sonner'
import type { ContentDetail, ContentType, SeasonData, EpisodeData } from '@/lib/types'

interface WatchClientProps {
  type: ContentType
  id: string
  initialEpisodeId?: string
  detail: ContentDetail
  recommendations: import('@/lib/types').ContentCardData[]
}

export function WatchClient({ type, id, initialEpisodeId, detail, recommendations }: WatchClientProps) {
  const router = useRouter()
  const { user } = useSession()
  const { inList, toggle } = useMyList(id, type)
  const [activeSeason, setActiveSeason] = useState<SeasonData | null>(
    detail.seasons.find((s) => s.episodes.some((e) => e.id === initialEpisodeId)) ?? detail.seasons[0] ?? null,
  )
  const [activeEpisode, setActiveEpisode] = useState<EpisodeData | null>(
    activeSeason?.episodes.find((e) => e.id === initialEpisodeId) ?? activeSeason?.episodes[0] ?? null,
  )
  const [contentVersion, setContentVersion] = useState(id + (initialEpisodeId ?? ''))

  // Reset when content changes (recommended render-time reset)
  const newVersion = id + (initialEpisodeId ?? '')
  if (newVersion !== contentVersion) {
    setContentVersion(newVersion)
    const s = detail.seasons.find((s) => s.episodes.some((e) => e.id === initialEpisodeId)) ?? detail.seasons[0] ?? null
    setActiveSeason(s)
    setActiveEpisode(s?.episodes.find((e) => e.id === initialEpisodeId) ?? s?.episodes[0] ?? null)
  }

  // Player key — changes when episode or movie changes, forces iframe reload
  const playerKey = useMemo(() => {
    if (type === 'movie') return `movie-${id}`
    return `ep-${activeEpisode?.id ?? id}`
  }, [type, id, activeEpisode])

  // Current servers
  const servers = useMemo(() => {
    if (type === 'movie') return detail.servers
    return activeEpisode?.servers ?? []
  }, [type, detail, activeEpisode])

  // Record history / progress when an episode or movie starts
  const reportProgress = useCallback(
    (progress: number) => {
      if (!user) return
      fetch('/api/watch/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: id,
          contentType: type,
          episodeId: activeEpisode?.id ?? null,
          progress,
          duration: type === 'movie' ? detail.runtime * 60 : (activeEpisode?.runtime ?? 0) * 60,
          position: Math.round((progress / 100) * (type === 'movie' ? detail.runtime * 60 : (activeEpisode?.runtime ?? 0) * 60)),
        }),
      }).catch(() => {})
    },
    [user, id, type, activeEpisode, detail.runtime],
  )

  useEffect(() => {
    // Mark as started (progress 5%)
    reportProgress(5)
    // Simulate progress increment for demo (embeds can't easily report real progress)
    const t = setInterval(() => {
      reportProgress(Math.min(90, 5 + Math.floor(Date.now() / 1000) % 80))
    }, 30000)
    return () => clearInterval(t)
  }, [reportProgress, playerKey])

  // Navigation: next/prev episode
  const allEpisodesFlat = useMemo(() => {
    const flat: { season: SeasonData; episode: EpisodeData }[] = []
    for (const s of detail.seasons) {
      for (const e of s.episodes) flat.push({ season: s, episode: e })
    }
    return flat
  }, [detail.seasons])

  const currentIndex = useMemo(
    () => allEpisodesFlat.findIndex((x) => x.episode.id === activeEpisode?.id),
    [allEpisodesFlat, activeEpisode],
  )
  const prevEp = currentIndex > 0 ? allEpisodesFlat[currentIndex - 1] : null
  const nextEp = currentIndex >= 0 && currentIndex < allEpisodesFlat.length - 1 ? allEpisodesFlat[currentIndex + 1] : null

  const onSelectEpisode = (season: SeasonData, episode: EpisodeData) => {
    setActiveSeason(season)
    setActiveEpisode(episode)
    // update url without full reload
    router.replace(`/watch/${type}/${id}?s=${season.seasonNumber}&e=${episode.episodeNumber}`, { scroll: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const typeIcon = type === 'movie' ? Film : type === 'anime' ? Sparkles : Tv
  const TypeIcon = typeIcon

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="fixed inset-x-0 top-0 z-50 glass-strong border-b border-border/60">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
          <BrandMark href="/" iconClassName="h-8 w-8" wordmarkClassName="text-xl" />
          <Link
            href={type === 'movie' ? '/movies' : type === 'anime' ? '/anime' : '/tv-series'}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to {type === 'movie' ? 'Movies' : type === 'anime' ? 'Anime' : 'Series'}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-20 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Main column */}
          <div className="min-w-0">
            <EmbedPlayer servers={servers} playerKey={playerKey} />

            {/* Title + meta */}
            <div className="mt-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary/15 text-primary">
                      <TypeIcon className="mr-1 h-3 w-3" />
                      {type === 'movie' ? 'Movie' : type === 'anime' ? 'Anime' : 'Series'}
                    </Badge>
                    {activeEpisode && activeSeason && (
                      <Badge variant="secondary">
                        S{activeSeason.seasonNumber} · E{activeEpisode.episodeNumber}
                      </Badge>
                    )}
                    {detail.topRated && <Badge className="bg-amber-500/90 text-amber-950">Top Rated</Badge>}
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
                    {detail.title}
                    {activeEpisode && (
                      <span className="ml-2 text-lg font-normal text-muted-foreground">
                        — {activeEpisode.title}
                      </span>
                    )}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold text-amber-400">
                      <Star className="h-4 w-4 fill-amber-400" /> {detail.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> {detail.releaseYear}
                    </span>
                    {type === 'movie' && detail.runtime > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {detail.runtime}m
                      </span>
                    )}
                    {activeEpisode && activeEpisode.runtime > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {activeEpisode.runtime}m
                      </span>
                    )}
                    <span>{detail.voteCount.toLocaleString()} votes</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={inList ? 'default' : 'secondary'}
                    onClick={toggle}
                    className="gap-2"
                  >
                    {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {inList ? 'In My List' : 'My List'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href)
                      toast.success('Link copied to clipboard')
                    }}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>
              </div>

              {/* Prev / Next episode */}
              {type !== 'movie' && (prevEp || nextEp) && (
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!prevEp}
                    onClick={() => prevEp && onSelectEpisode(prevEp.season, prevEp.episode)}
                    className="gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!nextEp}
                    onClick={() => nextEp && onSelectEpisode(nextEp.season, nextEp.episode)}
                    className="gap-1.5"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Synopsis */}
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Synopsis</h3>
                  <p className="text-sm leading-relaxed text-foreground/85 sm:text-base">
                    {activeEpisode?.description || detail.synopsis}
                  </p>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2">
                  {detail.genres.map((g) => (
                    <Link
                      key={g}
                      href={`/search?q=${encodeURIComponent(g)}`}
                      className="rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {g}
                    </Link>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Cast */}
                {detail.cast.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cast</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {detail.cast.slice(0, 8).map((c, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-2.5">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{c.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{c.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: episodes */}
          {type !== 'movie' && detail.seasons.length > 0 && (
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <EpisodeSelector
                seasons={detail.seasons}
                activeEpisodeId={activeEpisode?.id}
                onSelectEpisode={onSelectEpisode}
              />
            </aside>
          )}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {recommendations.map((item) => (
                <ContentCard key={`${item.type}-${item.id}`} item={item} className="w-full" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
