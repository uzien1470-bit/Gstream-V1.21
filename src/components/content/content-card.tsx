'use client'

import Link from 'next/link'
import { Star, Play, Plus, Check, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContentCardData } from '@/lib/types'
import { SmartImage } from './smart-image'
import { useMyList } from '@/hooks/use-my-list'
import { Badge } from '@/components/ui/badge'

interface ContentCardProps {
  item: ContentCardData
  className?: string
  showProgress?: boolean
  progress?: number
}

export function ContentCard({ item, className, showProgress, progress }: ContentCardProps) {
  const { inList, toggle } = useMyList(item.id, item.type)
  const href =
    item.type === 'movie'
      ? `/watch/movie/${item.id}`
      : `/watch/${item.type}/${item.id}`

  return (
    <div
      className={cn(
        'group/card relative w-[160px] shrink-0 sm:w-[180px] lg:w-[210px]',
        className,
      )}
    >
      <Link href={href} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-secondary card-shadow ring-1 ring-white/5 transition-all duration-300 group-hover/card:ring-2 group-hover/card:ring-primary/60">
          <SmartImage
            src={item.posterUrl}
            alt={item.title}
            className="h-full w-full"
            imgClassName="transition-transform duration-500 group-hover/card:scale-110"
          />
          {/* top badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {item.topRated && (
              <Badge className="bg-amber-500/90 text-amber-950 shadow">Top Rated</Badge>
            )}
            {item.trending && (
              <Badge className="bg-primary/90 text-primary-foreground shadow">Trending</Badge>
            )}
          </div>
          {/* rating chip */}
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-amber-400 backdrop-blur">
            <Star className="h-3 w-3 fill-amber-400" />
            {item.rating.toFixed(1)}
          </div>

          {/* hover overlay */}
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
                <Play className="h-4 w-4 fill-current" />
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  toggle()
                }}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/40 bg-black/50 text-white backdrop-blur transition-colors hover:border-white"
                aria-label={inList ? 'Remove from My List' : 'Add to My List'}
              >
                {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {showProgress && typeof progress === 'number' && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>
      </Link>

      {/* title + meta */}
      <div className="mt-2 px-0.5">
        <h3 className="truncate text-sm font-semibold text-foreground">{item.title}</h3>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.releaseYear}</span>
          {item.type !== 'movie' && (
            <>
              <span className="h-1 w-1 rounded-full bg-muted-foreground" />
              <span className="capitalize">{item.type === 'anime' ? 'Anime' : 'Series'}</span>
            </>
          )}
          {item.runtime ? (
            <>
              <span className="h-1 w-1 rounded-full bg-muted-foreground" />
              <span>{item.runtime}m</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function ContentCardSkeleton() {
  return (
    <div className="w-[160px] shrink-0 sm:w-[180px] lg:w-[210px]">
      <div className="aspect-[2/3] shimmer rounded-xl" />
      <div className="mt-2 h-3 w-3/4 shimmer rounded" />
      <div className="mt-1 h-2 w-1/2 shimmer rounded" />
    </div>
  )
}
