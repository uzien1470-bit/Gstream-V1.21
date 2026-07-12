import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { movieToCard, seriesToCard } from '@/lib/content'
import type { ContentCardData } from '@/lib/types'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ items: [] as ContentCardData[] })

  // Get distinct content the user has watched, most recent first
  const history = await db.watchHistory.findMany({
    where: { userId: user.id },
    orderBy: { watchedAt: 'desc' },
    take: 60,
    include: {
      movie: { include: { genres: { select: { name: true } } } },
      series: { include: { genres: { select: { name: true } } } },
      episode: true,
    },
  })

  const seen = new Set<string>()
  const items: (ContentCardData & { episodeId?: string | null; watchedAt: string })[] = []
  for (const h of history) {
    const key = h.movieId ?? h.seriesId
    if (!key || seen.has(key)) continue
    seen.add(key)
    if (h.movie) {
      items.push({ ...movieToCard(h.movie, h.movie.genres), watchedAt: h.watchedAt.toISOString() })
    } else if (h.series) {
      items.push({ ...seriesToCard(h.series, h.series.genres), episodeId: h.episodeId, watchedAt: h.watchedAt.toISOString() })
    }
  }
  return NextResponse.json({ items })
}
