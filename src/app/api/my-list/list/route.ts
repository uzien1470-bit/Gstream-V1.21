import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { movieToCard, seriesToCard } from '@/lib/content'
import type { ContentCardData } from '@/lib/types'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ items: [] })
  }
  const items = await db.myList.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { movie: { include: { genres: { select: { name: true } } } }, series: { include: { genres: { select: { name: true } } } } },
  })

  const cards: ContentCardData[] = []
  for (const it of items) {
    if (it.movie) cards.push(movieToCard(it.movie, it.movie.genres))
    if (it.series) cards.push(seriesToCard(it.series, it.series.genres))
  }
  return NextResponse.json({ items: cards })
}
