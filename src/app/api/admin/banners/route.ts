import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const items = await db.featuredBanner.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    include: {
      movie: { select: { id: true, title: true } },
      series: { select: { id: true, title: true } },
    },
  })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (!body.imageUrl || typeof body.imageUrl !== 'string' || !body.imageUrl.trim()) {
    return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
  }

  const movieId = typeof body.movieId === 'string' && body.movieId ? body.movieId : null
  const seriesId = typeof body.seriesId === 'string' && body.seriesId ? body.seriesId : null

  const data: any = {
    title: body.title.trim(),
    description: typeof body.description === 'string' ? body.description : '',
    imageUrl: body.imageUrl.trim(),
    logoUrl:
      typeof body.logoUrl === 'string' && body.logoUrl.trim() ? body.logoUrl.trim() : null,
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
    active: body.active !== undefined ? Boolean(body.active) : true,
    movieId,
    seriesId,
  }
  const item = await db.featuredBanner.create({ data })
  return NextResponse.json({ item })
}
