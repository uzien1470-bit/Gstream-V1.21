'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  priority?: boolean
  sizes?: string
}

/**
 * Image component with graceful fallback to a cinematic gradient
 * with the title initial if the source fails to load.
 *
 * Uses the `key` prop to force a fresh <img> element whenever `src`
 * changes (so onLoad fires cleanly), plus a ref callback that detects
 * cached images that completed before React hydrated — preventing the
 * "stuck on loading shimmer forever" bug.
 */
export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  priority,
  sizes,
}: SmartImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (error || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-primary/30 via-background to-secondary text-5xl font-bold text-primary-foreground/70',
          className,
        )}
      >
        <span className="opacity-60">
          {alt?.[0]?.toUpperCase() || 'G'}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-secondary', className)}>
      {!loaded && <div className="absolute inset-0 shimmer" />}
      <img
        key={src}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        ref={(img) => {
          // If the image was already complete (browser cache), set loaded.
          // This runs after render + hydration, catching cached images
          // whose onLoad fired before React attached the handler.
          if (img && img.complete && img.naturalWidth > 0) {
            setLoaded(true)
          }
        }}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName,
        )}
      />
    </div>
  )
}
