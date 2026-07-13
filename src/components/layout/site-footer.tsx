'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Film, Tv, Sparkles, Mail, Globe, Github, Twitter } from 'lucide-react'
import { BrandMark } from '@/components/layout/brand-mark'

const FOOTER_LINKS = [
  {
    title: 'Browse',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Movies', href: '/movies' },
      { label: 'TV Series', href: '/tv-series' },
      { label: 'Anime', href: '/anime' },
      { label: 'Search', href: '/search' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'My Profile', href: '/profile' },
      { label: 'My List', href: '/my-list' },
      { label: 'Watch History', href: '/watch-history' },
      { label: 'Sign In', href: '/login' },
      { label: 'Create Account', href: '/register' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Gstream', href: '/' },
      { label: 'Careers', href: '/' },
      { label: 'Press', href: '/' },
      { label: 'Investors', href: '/' },
      { label: 'Contact', href: '/' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/' },
      { label: 'Privacy Policy', href: '/' },
      { label: 'Cookie Policy', href: '/' },
      { label: 'Content Guidelines', href: '/' },
      { label: 'DMCA', href: '/' },
    ],
  },
]

export function SiteFooter() {
  const pathname = usePathname()
  if (pathname.startsWith('/watch') || pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')) {
    return null
  }

  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <BrandMark href="/" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The premium cinematic streaming destination. Unlimited movies, series and anime — beautifully curated, endlessly streamable.
            </p>
            <div className="mt-5 flex gap-3">
              {[Twitter, Github, Mail, Globe].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/80">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Gstream. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5" /> Movies
            </span>
            <span className="flex items-center gap-1.5">
              <Tv className="h-3.5 w-3.5" /> Series
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Anime
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
