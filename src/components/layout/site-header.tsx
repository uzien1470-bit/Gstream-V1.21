'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Search, Menu, X, Film, Tv, Sparkles, Bookmark, History,
  User, LogOut, LayoutDashboard, Shield, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from '@/hooks/use-session'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/movies', label: 'Movies', icon: Film },
  { href: '/tv-series', label: 'TV Series', icon: Tv },
  { href: '/anime', label: 'Anime', icon: Sparkles },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useSession()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Skip header on watch & admin pages (they have their own chrome)
  if (pathname.startsWith('/watch') || pathname.startsWith('/admin')) {
    return null
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setSearchOpen(false)
      setMobileOpen(false)
    }
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'glass-strong border-b border-border/60 py-3'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5',
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-4 sm:px-6 lg:px-10">
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span
            className="text-2xl font-extrabold tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            G<span className="text-primary">stream</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
                {active && (
                  <span className="mt-0.5 block h-0.5 w-full rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

        {/* Search */}
        <form
          onSubmit={submitSearch}
          className={cn(
            'hidden items-center transition-all duration-300 md:flex',
            searchOpen ? 'w-64 lg:w-80' : 'w-9',
          )}
        >
          <div
            className={cn(
              'flex h-9 items-center overflow-hidden rounded-full border transition-all',
              searchOpen
                ? 'border-border bg-card/80 px-3'
                : 'border-transparent bg-transparent',
            )}
          >
            <button
              type="button"
              onClick={() => setSearchOpen((s) => !s)}
              className="grid h-6 w-6 place-items-center text-muted-foreground hover:text-foreground"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            {searchOpen && (
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search titles, genres, actors..."
                className="ml-2 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            )}
          </div>
        </form>

        {/* My list */}
        {user && (
          <Link
            href="/my-list"
            className="hidden text-muted-foreground transition-colors hover:text-foreground sm:block"
            aria-label="My List"
          >
            <Bookmark className="h-5 w-5" />
          </Link>
        )}

        {/* User menu / auth */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-white/5">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name || user.email} />
                  <AvatarFallback className="bg-primary/20 text-xs text-primary">
                    {(user.name || user.email)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-strong">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Signed in as
                <div className="truncate text-sm text-foreground">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/my-list" className="cursor-pointer">
                  <Bookmark className="mr-2 h-4 w-4" /> My List
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/watch-history" className="cursor-pointer">
                  <History className="mr-2 h-4 w-4" /> Watch History
                </Link>
              </DropdownMenuItem>
              {user.role === 'admin' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer text-primary">
                      <Shield className="mr-2 h-4 w-4" /> Admin Panel
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut().then(() => router.push('/login'))}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/register">Join Gstream</Link>
            </Button>
          </div>
        )}

        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              className="grid h-9 w-9 place-items-center rounded-md text-foreground lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 glass-strong p-0">
            <SheetHeader className="px-6 pt-6">
              <SheetTitle className="text-left" style={{ fontFamily: 'var(--font-display)' }}>
                G<span className="text-primary">stream</span>
              </SheetTitle>
            </SheetHeader>
            <div className="px-4 py-4">
              <form onSubmit={submitSearch} className="mb-4">
                <div className="flex items-center rounded-full border border-border bg-card/60 px-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="ml-2 w-full bg-transparent py-2 text-sm outline-none"
                  />
                </div>
              </form>
              <nav className="flex flex-col gap-1">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/5',
                      pathname === item.href ? 'bg-white/5 text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="my-4 h-px bg-border" />
              {user ? (
                <nav className="flex flex-col gap-1">
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5">Profile</Link>
                  <Link href="/my-list" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5">My List</Link>
                  <Link href="/watch-history" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5">Watch History</Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-primary hover:bg-white/5">
                      <LayoutDashboard className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); router.push('/login') }}
                    className="rounded-md px-3 py-2.5 text-left text-sm text-destructive hover:bg-white/5"
                  >
                    Sign out
                  </button>
                </nav>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" onClick={() => setMobileOpen(false)}>
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild onClick={() => setMobileOpen(false)}>
                    <Link href="/register">Join Gstream</Link>
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
