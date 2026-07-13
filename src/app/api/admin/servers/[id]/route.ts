import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
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
    const supabase = createAdminSupabaseClient()
    const { data: item, error } = await supabase
      .from('StreamingServer')
      .update(data)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A server with this name or slug already exists' },
          { status: 409 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!item) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }
    return NextResponse.json({ item })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
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
    const supabase = createAdminSupabaseClient()
    const { error, count } = await supabase
      .from('StreamingServer')
      .delete({ count: 'exact' })
      .eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (count === 0) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
