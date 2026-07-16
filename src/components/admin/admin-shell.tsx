'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Film, Tv, Sparkles, FolderTree, PlayCircle,
  Tag, Folder, Image, Server, Users, LogOut, Menu, X, Shield, Home, UserCircle, ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSession } from '@/hooks/use-session'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/movies', label: 'Movies', icon: Film },
  { href: '/admin/tv-series', label: 'TV Series', icon: Tv },
  { href: '/admin/anime', label: 'Anime', icon: Sparkles },
  { href: '/admin/actors', label: 'Actors', icon: UserCircle },
  { href: '/admin/seasons', label: 'Seasons', icon: FolderTree },
  { href: '/admin/episodes', label: 'Episodes', icon: PlayCircle },
  { href: '/admin/genres', label: 'Genres', icon: Tag },
  { href: '/admin/categories', label: 'Categories', icon: Folder },
  { href: '/admin/banners', label: 'Featured Banners', icon: Image },
  { href: '/admin/avatars', label: 'Profile Avatars', icon: ImageIcon },
  { href: '/admin/servers', label: 'Streaming Servers', icon: Server },
  { href: '/admin/users', label: 'Users', icon: Users },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useSession()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login')
      else if (user.role !== 'admin') router.replace('/')
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-center">
          <Shield className="mx-auto h-8 w-8 animate-pulse text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="group flex items-center gap-2 px-6 py-5">
        { }
        <img
          src="/logo.png"
          alt="Gstream"
          className="h-8 w-8 rounded-lg shadow-lg shadow-primary/20 transition-transform group-hover:scale-105"
        />
        <span className="text-lg font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          G<span className="text-primary">stream</span>
        </span>
        <span className="ml-1 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
          Admin
        </span>
      </Link>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground">
          <Home className="h-4 w-4" /> Back to Site
        </Link>
        <button
          onClick={() => {
            fetch('/api/auth/logout', { method: 'POST' }).then(() => router.push('/login'))
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 lg:block">
        <div className="sticky top-0 h-screen">
          {sidebar}
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="fixed left-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-lg glass-strong text-foreground lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 glass-strong">
          {sidebar}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-4 pt-16 sm:p-6 lg:p-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  )
}
