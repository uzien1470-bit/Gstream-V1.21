'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Star, Calendar, Clock, Plus, Check, Play, Film,
  Tv, Sparkles, Bookmark, Share2, ChevronLeft, ChevronRight, User,
  X,
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
  const [trailerOpen, setTrailerOpen] = useState(false)

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

  // Report progress when an episode or movie starts
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
    reportProgress(5)
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

      {/* ───────────────────────── Cinematic Hero ───────────────────────── */}
      {/* pt-16 accounts for the fixed header (h-16 ≈ 64px) so the hero
          background starts below the header and the content is never
          hidden behind it, regardless of screen size. */}
      <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden pt-16">
        <SmartImage
          src={detail.backdropUrl || detail.posterUrl}
          alt={detail.title}
          className="absolute inset-0 h-full w-full"
          imgClassName="object-cover"
          priority
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        {/* Hero content */}
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-10 lg:pb-14">
            <div className="max-w-2xl">
              {/* Badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/15 text-primary backdrop-blur">
                  <TypeIcon className="mr-1 h-3 w-3" />
                  {type === 'movie' ? 'Movie' : type === 'anime' ? 'Anime' : 'Series'}
                </Badge>
                {activeEpisode && activeSeason && (
                  <Badge variant="secondary" className="backdrop-blur">
                    S{activeSeason.seasonNumber} · E{activeEpisode.episodeNumber}
                  </Badge>
                )}
                {detail.topRated && <Badge className="bg-amber-500/90 text-amber-950 backdrop-blur">Top Rated</Badge>}
              </div>

              {/* Logo (if exists) or title fallback */}
              {detail.logoUrl ? (
                <div className="mb-4">
                  <img
                    src={detail.logoUrl}
                    alt={detail.title}
                    className="max-h-32 w-auto max-w-full object-contain"
                  />
                </div>
              ) : (
                <h1
                  className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-foreground text-glow sm:text-5xl lg:text-6xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {detail.title}
                  {activeEpisode && (
                    <span className="ml-3 text-2xl font-normal text-muted-foreground">
                      — {activeEpisode.title}
                    </span>
                  )}
                </h1>
              )}

              {/* Meta info */}
              <div className="mb-5 flex flex-wrap items-center gap-4 text-sm text-foreground/80">
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
                <span className="text-muted-foreground">{detail.voteCount.toLocaleString()} votes</span>
              </div>

              {/* Genres */}
              {detail.genres.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {detail.genres.slice(0, 5).map((g) => (
                    <Link
                      key={g}
                      href={`/search?q=${encodeURIComponent(g)}`}
                      className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-foreground/80 backdrop-blur transition-colors hover:border-primary hover:text-primary"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <a href="#player">
                    <Play className="mr-2 h-5 w-5 fill-current" /> Play Now
                  </a>
                </Button>
                {detail.trailerUrl && (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="glass text-foreground hover:bg-white/10"
                    onClick={() => setTrailerOpen(true)}
                  >
                    <Play className="mr-2 h-5 w-5" /> Watch Trailer
                  </Button>
                )}
                <Button
                  size="lg"
                  variant={inList ? 'default' : 'secondary'}
                  className={inList ? 'bg-primary text-primary-foreground' : 'glass text-foreground hover:bg-white/10'}
                  onClick={toggle}
                >
                  {inList ? <Check className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
                  {inList ? 'In My List' : 'My List'}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="glass text-foreground hover:bg-white/10"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href)
                    toast.success('Link copied to clipboard')
                  }}
                >
                  <Share2 className="mr-2 h-5 w-5" /> Share
                </Button>
              </div>

              {/* Synopsis */}
              <p className="mt-5 line-clamp-3 max-w-xl text-sm text-foreground/75 sm:text-base">
                {activeEpisode?.description || detail.synopsis}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Player + Details ───────────────────────── */}
      <div className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Main column */}
          <div className="min-w-0">
            {/* Embedded player — kept exactly as-is, BELOW the hero */}
            <div id="player" className="scroll-mt-20">
              <EmbedPlayer servers={servers} playerKey={playerKey} />
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

            {/* Synopsis + Genres + Cast */}
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
                    {detail.cast.slice(0, 8).map((c, i) => {
                      const castCard = (
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-2.5 transition-colors hover:border-primary/40">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary/15">
                            {c.image ? (
                              <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-primary">
                                <User className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{c.name}</div>
                            {c.role && <div className="truncate text-xs text-muted-foreground">{c.role}</div>}
                          </div>
                        </div>
                      )
                      return c.actorSlug ? (
                        <Link key={i} href={`/actors/${c.actorSlug}`}>{castCard}</Link>
                      ) : (
                        <div key={i}>{castCard}</div>
                      )
                    })}
                  </div>
                </div>
              )}
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

      {/* ───────────────────────── Trailer Modal ───────────────────────── */}
      {trailerOpen && detail.trailerUrl && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4"
          onClick={() => setTrailerOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setTrailerOpen(false)}
              className="absolute -top-12 right-0 flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
              aria-label="Close trailer"
            >
              Close <X className="h-5 w-5" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-2xl">
              <iframe
                src={detail.trailerUrl}
                title="Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="origin-when-cross-origin"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
