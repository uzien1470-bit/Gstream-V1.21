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
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    data.name = body.name.trim()
    data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }
  if (body.priority !== undefined) {
    if (!Number.isFinite(Number(body.priority))) {
      return NextResponse.json({ error: 'Priority must be a number' }, { status: 400 })
    }
    data.priority = Number(body.priority)
  }
  if (body.status !== undefined) {
    data.status = body.status === 'inactive' ? 'inactive' : 'active'
  }
  try {
    const item = await db.streamingServer.update({ where: { id }, data })
    return NextResponse.json({ item })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'A server with this name or slug already exists' }, { status: 409 })
    }
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
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
    await db.streamingServer.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }
    throw err
  }
}
