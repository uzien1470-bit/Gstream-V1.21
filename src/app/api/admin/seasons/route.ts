import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { searchParams } = new URL(req.url)
  const seriesId = searchParams.get('seriesId')
  const q = searchParams.get('q') ?? ''

  const where: any = {}
  if (seriesId) where.seriesId = seriesId
  if (q) {
    const series = await db.series.findMany({
      where: { OR: [{ title: { contains: q } }, { type: { contains: q } }] },
      select: { id: true },
    })
    where.seriesId = { in: series.map((s) => s.id) }
  }

  const seasons = await db.season.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      series: { select: { id: true, title: true, type: true, posterUrl: true } },
      _count: { select: { episodes: true } },
    },
  })
  return NextResponse.json({ items: seasons })
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const series = await db.series.findUnique({ where: { id: body.seriesId } })
  if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 })

  const created = await db.season.create({
    data: {
      seriesId: body.seriesId,
      seasonNumber: Number(body.seasonNumber),
      title: body.title || `Season ${body.seasonNumber}`,
      description: body.description ?? null,
      posterUrl: body.posterUrl ?? null,
    },
  })
  await db.series.update({ where: { id: body.seriesId }, data: { recentlyUpdated: true } })
  return NextResponse.json({ item: created })
}
