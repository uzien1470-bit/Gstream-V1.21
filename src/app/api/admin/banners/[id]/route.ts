import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const data: any = {}
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    data.title = body.title.trim()
  }
  if (body.description !== undefined) data.description = String(body.description)
  if (body.imageUrl !== undefined) {
    if (typeof body.imageUrl !== 'string' || !body.imageUrl.trim()) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }
    data.imageUrl = body.imageUrl.trim()
  }
  if (body.logoUrl !== undefined) {
    data.logoUrl =
      typeof body.logoUrl === 'string' && body.logoUrl.trim() ? body.logoUrl.trim() : null
  }
  if (body.order !== undefined && Number.isFinite(Number(body.order))) {
    data.order = Number(body.order)
  }
  if (body.active !== undefined) data.active = Boolean(body.active)

  if (body.movieId !== undefined) {
    data.movieId = typeof body.movieId === 'string' && body.movieId ? body.movieId : null
  }
  if (body.seriesId !== undefined) {
    data.seriesId = typeof body.seriesId === 'string' && body.seriesId ? body.seriesId : null
  }

  try {
    const item = await db.featuredBanner.update({ where: { id }, data })
    return NextResponse.json({ item })
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }
    throw err
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await db.featuredBanner.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }
    throw err
  }
}
