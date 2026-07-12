import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [
    movies, series, anime, seasons, episodes, genres, categories,
    servers, banners, users, activeUsers, suspendedUsers, myListCount,
    historyCount, progressCount,
  ] = await Promise.all([
    db.movie.count(),
    db.series.count({ where: { type: 'series' } }),
    db.series.count({ where: { type: 'anime' } }),
    db.season.count(),
    db.episode.count(),
    db.genre.count(),
    db.category.count(),
    db.streamingServer.count(),
    db.featuredBanner.count({ where: { active: true } }),
    db.user.count(),
    db.user.count({ where: { status: 'active' } }),
    db.user.count({ where: { status: 'suspended' } }),
    db.myList.count(),
    db.watchHistory.count(),
    db.watchProgress.count(),
  ])

  // Recent activity (last 10 watch history)
  const recentActivity = await db.watchHistory.findMany({
    orderBy: { watchedAt: 'desc' },
    take: 10,
    include: {
      user: { select: { name: true, email: true } },
      movie: { select: { title: true } },
      series: { select: { title: true } },
      episode: { select: { title: true, episodeNumber: true } },
    },
  })

  return NextResponse.json({
    stats: {
      movies, series, anime, seasons, episodes, genres, categories,
      servers, banners, users, activeUsers, suspendedUsers,
      myListCount, historyCount, progressCount,
    },
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      watchedAt: a.watchedAt.toISOString(),
      user: a.user.name || a.user.email,
      title: a.movie?.title ?? a.series?.title ?? 'Unknown',
      episode: a.episode ? `E${a.episode.episodeNumber} · ${a.episode.title}` : null,
      contentType: a.contentType,
    })),
  })
}
