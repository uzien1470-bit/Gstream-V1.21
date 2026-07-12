'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContentCard, ContentCardSkeleton } from './content-card'
import type { ContentCardData } from '@/lib/types'

interface ContentRowProps {
  title: string
  items: ContentCardData[]
  loading?: boolean
  className?: string
  showProgress?: boolean
}

export function ContentRow({ title, items, loading, className, showProgress }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const updateArrows = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    updateArrows()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [items])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.85
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <section className={cn('group/row relative', className)}>
      <div className="mb-3 flex items-center justify-between px-4 sm:px-6 lg:px-10">
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
      </div>

      <div className="relative">
        {/* left arrow */}
        {canLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center transition-opacity md:flex"
            aria-label="Scroll left"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full glass-strong text-foreground opacity-0 transition-opacity group-hover/row:opacity-100">
              <ChevronLeft className="h-5 w-5" />
            </span>
          </button>
        )}
        {/* right arrow */}
        {canRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center transition-opacity md:flex"
            aria-label="Scroll right"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full glass-strong text-foreground opacity-0 transition-opacity group-hover/row:opacity-100">
              <ChevronRight className="h-5 w-5" />
            </span>
          </button>
        )}

        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-6 lg:px-10"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ContentCardSkeleton key={i} />)
            : items.map((item) => (
                <ContentCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  showProgress={showProgress}
                  progress={showProgress ? (item as any).progress : undefined}
                />
              ))}
        </div>
      </div>
    </section>
  )
}
