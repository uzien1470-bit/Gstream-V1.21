import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  contentId: z.string(),
  contentType: z.enum(['movie', 'series', 'anime']),
  episodeId: z.string().nullable().optional(),
  progress: z.number().min(0).max(100),
  duration: z.number().int().nonnegative().optional(),
  position: z.number().int().nonnegative().optional(),
})

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ ok: true }) // silently ignore for guests
  }
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { contentId, contentType, episodeId, progress, duration, position } = parsed.data

  const where: any = { userId: user.id }
  if (contentType === 'movie') where.movieId = contentId
  else where.seriesId = contentId
  if (episodeId) where.episodeId = episodeId

  const data: any = {
    progress,
    duration: duration ?? 0,
    position: position ?? 0,
    contentType,
  }
  if (contentType === 'movie') data.movieId = contentId
  else data.seriesId = contentId
  if (episodeId) data.episodeId = episodeId

  // upsert
  const existing = await db.watchProgress.findFirst({ where })
  if (existing) {
    await db.watchProgress.update({ where: { id: existing.id }, data })
  } else {
    await db.watchProgress.create({ data: { userId: user.id, ...data } })
  }

  // also record a history entry (idempotent-ish: insert)
  const histData: any = {
    userId: user.id,
    contentType,
  }
  if (contentType === 'movie') histData.movieId = contentId
  else histData.seriesId = contentId
  if (episodeId) histData.episodeId = episodeId
  await db.watchHistory.create({ data: histData }).catch(() => {})

  return NextResponse.json({ ok: true })
}
