import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const items = await db.streamingServer.findMany({
    orderBy: [{ priority: 'asc' }, { name: 'asc' }],
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
  if (!body || !body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  const name = body.name.trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const slug = slugify(name)
  const priority = Number.isFinite(Number(body.priority)) ? Number(body.priority) : 0
  const status = body.status === 'inactive' ? 'inactive' : 'active'
  try {
    const item = await db.streamingServer.create({ data: { name, slug, priority, status } })
    return NextResponse.json({ item })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'A server with this name or slug already exists' }, { status: 409 })
    }
    throw err
  }
}
