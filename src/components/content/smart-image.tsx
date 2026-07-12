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
  const [prevSrc, setPrevSrc] = useState(src)

  // Reset when src changes (recommended pattern: set state during render)
  if (src !== prevSrc) {
    setPrevSrc(src)
    setError(false)
    setLoaded(false)
  }

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
      { }
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName,
        )}
      />
    </div>
  )
}
