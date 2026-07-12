'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SmartImage } from './smart-image'
import { cn } from '@/lib/utils'
import type { ContentCardData } from '@/lib/types'

export interface HeroSlide extends ContentCardData {
  synopsis: string
  logoUrl?: string | null
}

interface HeroBannerProps {
  slides: HeroSlide[]
}

export function HeroBanner({ slides }: HeroBannerProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = slides.length

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total])
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total])

  useEffect(() => {
    if (paused || total <= 1) return
    const t = setInterval(next, 8000)
    return () => clearInterval(t)
  }, [paused, next, total])

  if (!slides.length) return null
  const slide = slides[index]
  const href =
    slide.type === 'movie' ? `/watch/movie/${slide.id}` : `/watch/${slide.type}/${slide.id}`

  return (
    <section
      className="relative h-[78vh] min-h-[520px] w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Backgrounds */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000',
            i === index ? 'opacity-100' : 'opacity-0',
          )}
        >
          <SmartImage
            src={s.backdropUrl}
            alt={s.title}
            className="h-full w-full"
            imgClassName="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Gradient overlays */}
      <div className="absolute inset-0 hero-fade-left" />
      <div className="absolute inset-0 hero-fade-bottom" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-28 sm:px-6 sm:pb-32 lg:px-10 lg:pb-40">
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">Featured</Badge>
              {slide.topRated && (
                <Badge className="bg-amber-500/90 text-amber-950">Top Rated</Badge>
              )}
              <span className="flex items-center gap-1 text-sm font-semibold text-amber-400">
                <Star className="h-4 w-4 fill-amber-400" /> {slide.rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">{slide.releaseYear}</span>
              <span className="text-sm capitalize text-muted-foreground">
                {slide.type === 'movie' ? 'Movie' : slide.type === 'anime' ? 'Anime' : 'Series'}
              </span>
            </div>

            <h1
              className="text-4xl font-extrabold leading-tight tracking-tight text-foreground text-glow sm:text-5xl lg:text-6xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {slide.title}
            </h1>

            <p className="mt-4 line-clamp-3 max-w-xl text-sm text-foreground/80 sm:text-base">
              {slide.synopsis}
            </p>

            {slide.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {slide.genres.slice(0, 4).map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-foreground/80"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href={href}>
                  <Play className="mr-2 h-5 w-5 fill-current" /> Play Now
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="glass text-foreground hover:bg-white/10">
                <Link href={href}>
                  <Info className="mr-2 h-5 w-5" /> More Info
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Arrows */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full glass-strong p-2 text-foreground lg:block"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full glass-strong p-2 text-foreground lg:block"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 right-6 z-20 flex gap-2 sm:right-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-8 bg-primary' : 'w-3 bg-white/40 hover:bg-white/70',
                )}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
