'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  const { user, loading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [user, loading, router])

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left visual */}
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-secondary" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, oklch(0.62 0.22 16 / 0.4), transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.7 0.15 50 / 0.3), transparent 40%)',
          }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              G<span className="text-primary">stream</span>
            </span>
          </Link>
          <div>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-glow" style={{ fontFamily: 'var(--font-display)' }}>
              The cinematic<br />streaming universe.
            </h2>
            <p className="mt-4 max-w-md text-foreground/70">
              Unlimited movies, premium series, and legendary anime — all in one luxurious destination.
            </p>
            <div className="mt-8 flex gap-6">
              <div>
                <div className="text-3xl font-extrabold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Titles</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-primary">4K</div>
                <div className="text-sm text-muted-foreground">Ultra HD</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-primary">6</div>
                <div className="text-sm text-muted-foreground">Servers</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Gstream. All rights reserved.</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              G<span className="text-primary">stream</span>
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>
    </div>
  )
}
