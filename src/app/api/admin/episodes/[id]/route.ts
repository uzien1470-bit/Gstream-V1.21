import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const ep = await db.episode.findUnique({
    where: { id },
    include: { servers: { include: { server: true } } },
  })
  if (!ep) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ item: ep })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const updated = await db.episode.update({
    where: { id },
    data: {
      episodeNumber: Number(body.episodeNumber),
      title: body.title,
      description: body.description ?? null,
      thumbnailUrl: body.thumbnailUrl ?? null,
      runtime: Number(body.runtime) ?? 0,
      airDate: body.airDate ?? null,
    },
  })

  // Replace servers
  await db.episodeServer.deleteMany({ where: { episodeId: id } })
  if (Array.isArray(body.servers)) {
    for (const s of body.servers) {
      if (!s.serverId || !s.embedUrl) continue
      await db.episodeServer.create({
        data: {
          episodeId: id,
          serverId: s.serverId,
          embedUrl: s.embedUrl,
          quality: s.quality ?? 'Auto',
          priority: Number(s.priority) ?? 0,
          status: s.status ?? 'active',
        },
      })
    }
  }
  return NextResponse.json({ item: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  await db.episode.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
