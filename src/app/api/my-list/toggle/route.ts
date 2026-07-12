import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  contentId: z.string(),
  contentType: z.enum(['movie', 'series', 'anime']),
})

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { contentId, contentType } = parsed.data

  const where: any = { userId: user.id }
  if (contentType === 'movie') where.movieId = contentId
  else where.seriesId = contentId

  const existing = await db.myList.findFirst({ where })
  if (existing) {
    await db.myList.delete({ where: { id: existing.id } })
    return NextResponse.json({ inList: false })
  }

  // Verify content exists
  if (contentType === 'movie') {
    const m = await db.movie.findUnique({ where: { id: contentId } })
    if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await db.myList.create({
      data: { userId: user.id, movieId: contentId, contentType },
    })
  } else {
    const s = await db.series.findUnique({ where: { id: contentId } })
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await db.myList.create({
      data: { userId: user.id, seriesId: contentId, contentType },
    })
  }
  return NextResponse.json({ inList: true })
}
