import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { movieToCard, seriesToCard } from '@/lib/content'
import type { ContentCardData } from '@/lib/types'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ items: [] as (ContentCardData & { progress: number; episodeId?: string | null })[] })

  const progress = await db.watchProgress.findMany({
    where: { userId: user.id, progress: { lt: 95 } },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })

  const items: (ContentCardData & { progress: number; episodeId?: string | null })[] = []
  for (const p of progress) {
    if (p.movieId) {
      const m = await db.movie.findUnique({
        where: { id: p.movieId },
        include: { genres: { select: { name: true } } },
      })
      if (m) items.push({ ...movieToCard(m, m.genres), progress: p.progress, episodeId: null })
    } else if (p.seriesId) {
      const s = await db.series.findUnique({
        where: { id: p.seriesId },
        include: { genres: { select: { name: true } } },
      })
      if (s) items.push({ ...seriesToCard(s, s.genres), progress: p.progress, episodeId: p.episodeId })
    }
  }
  return NextResponse.json({ items })
}
