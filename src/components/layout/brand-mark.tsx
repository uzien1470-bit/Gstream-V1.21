import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  href?: string
  className?: string
  iconClassName?: string
  showWordmark?: boolean
  wordmarkClassName?: string
}

/**
 * Gstream brand mark — the logo image + "Gstream" wordmark.
 * Used in the header, footer, auth pages, watch page, and admin shell.
 */
export function BrandMark({
  href = '/',
  className,
  iconClassName,
  showWordmark = true,
  wordmarkClassName,
}: BrandMarkProps) {
  return (
    <Link href={href} className={cn('group flex shrink-0 items-center gap-2', className)}>
      { }
      <img
        src="/logo.png"
        alt="Gstream"
        className={cn(
          'rounded-lg shadow-lg shadow-primary/20 transition-transform group-hover:scale-105',
          iconClassName ?? 'h-9 w-9',
        )}
      />
      {showWordmark && (
        <span
          className={cn(
            'text-2xl font-extrabold tracking-tight text-foreground',
            wordmarkClassName,
          )}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          G<span className="text-primary">stream</span>
        </span>
      )}
    </Link>
  )
}
