'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Film, Tv, Sparkles, FolderTree, PlayCircle, Tag, Folder, Image,
  Server, Users, Activity, Bookmark, History, Loader2, UserCheck, UserX,
} from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Stats {
  movies: number; series: number; anime: number; seasons: number; episodes: number
  genres: number; categories: number; servers: number; banners: number
  users: number; activeUsers: number; suspendedUsers: number
  myListCount: number; historyCount: number; progressCount: number
}
interface Activity {
  id: string; watchedAt: string; user: string; title: string; episode: string | null; contentType: string
}

const STAT_CARDS = [
  { key: 'movies', label: 'Movies', icon: Film, href: '/admin/movies', color: 'text-rose-400' },
  { key: 'series', label: 'TV Series', icon: Tv, href: '/admin/tv-series', color: 'text-amber-400' },
  { key: 'anime', label: 'Anime', icon: Sparkles, href: '/admin/anime', color: 'text-purple-400' },
  { key: 'seasons', label: 'Seasons', icon: FolderTree, href: '/admin/seasons', color: 'text-sky-400' },
  { key: 'episodes', label: 'Episodes', icon: PlayCircle, href: '/admin/episodes', color: 'text-emerald-400' },
  { key: 'genres', label: 'Genres', icon: Tag, href: '/admin/genres', color: 'text-pink-400' },
  { key: 'categories', label: 'Categories', icon: Folder, href: '/admin/categories', color: 'text-orange-400' },
  { key: 'servers', label: 'Servers', icon: Server, href: '/admin/servers', color: 'text-cyan-400' },
  { key: 'banners', label: 'Banners', icon: Image, href: '/admin/banners', color: 'text-indigo-400' },
  { key: 'users', label: 'Users', icon: Users, href: '/admin/users', color: 'text-lime-400' },
] as const

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats)
        setActivity(d.recentActivity ?? [])
      })
      .catch(() => {})
  }, [])

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Overview of your streaming platform.</p>
      </div>

      {/* Stat cards */}
      {!stats ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {STAT_CARDS.map((c) => (
              <Link key={c.key} href={c.href}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <c.icon className={`h-5 w-5 ${c.color}`} />
                      <span className="text-2xl font-extrabold">{(stats as any)[c.key]}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{c.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* User stats */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><UserCheck className="h-4 w-4 text-emerald-400" /> Active Users</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-extrabold">{stats.activeUsers}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><UserX className="h-4 w-4 text-rose-400" /> Suspended</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-extrabold">{stats.suspendedUsers}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-sky-400" /> Total Users</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-extrabold">{stats.users}</div></CardContent>
            </Card>
          </div>

          {/* Engagement stats */}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Bookmark className="h-4 w-4 text-amber-400" /> My List Items</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-extrabold">{stats.myListCount}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><History className="h-4 w-4 text-purple-400" /> Watch History</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-extrabold">{stats.historyCount}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4 text-rose-400" /> In-Progress</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-extrabold">{stats.progressCount}</div></CardContent>
            </Card>
          </div>

          {/* Recent activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Recent Watch Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
              ) : (
                <div className="space-y-2">
                  {activity.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card/30 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{a.title}</span>
                          {a.episode && <Badge variant="secondary" className="shrink-0">{a.episode}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{a.user}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(a.watchedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AdminShell>
  )
}
