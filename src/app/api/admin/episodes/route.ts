import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get('seasonId')

  const where: any = {}
  if (seasonId) where.seasonId = seasonId

  const episodes = await db.episode.findMany({
    where,
    orderBy: [{ seasonId: 'asc' }, { episodeNumber: 'asc' }],
    take: 200,
    include: {
      season: { include: { series: { select: { id: true, title: true, type: true } } } },
      servers: { include: { server: true } },
    },
  })
  return NextResponse.json({ items: episodes })
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const season = await db.season.findUnique({ where: { id: body.seasonId } })
  if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 })

  const created = await db.episode.create({
    data: {
      seasonId: body.seasonId,
      episodeNumber: Number(body.episodeNumber),
      title: body.title,
      description: body.description ?? null,
      thumbnailUrl: body.thumbnailUrl ?? null,
      runtime: Number(body.runtime) ?? 0,
      airDate: body.airDate ?? null,
    },
  })

  // Attach servers
  if (Array.isArray(body.servers)) {
    for (const s of body.servers) {
      if (!s.serverId || !s.embedUrl) continue
      await db.episodeServer.create({
        data: {
          episodeId: created.id,
          serverId: s.serverId,
          embedUrl: s.embedUrl,
          quality: s.quality ?? 'Auto',
          priority: Number(s.priority) ?? 0,
          status: s.status ?? 'active',
        },
      })
    }
  }
  return NextResponse.json({ item: created })
}
