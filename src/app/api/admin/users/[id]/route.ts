import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let current
  try {
    current = await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const data: { status?: string; role?: string } = {}

  // Status updates — only "active" | "suspended"
  if (body.status !== undefined) {
    if (!['active', 'suspended'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    if (body.status === 'suspended') {
      if (target.role === 'admin') {
        return NextResponse.json(
          { error: 'Cannot suspend an admin user' },
          { status: 400 },
        )
      }
      if (target.id === current.id) {
        return NextResponse.json(
          { error: 'You cannot suspend your own account' },
          { status: 400 },
        )
      }
    }
    data.status = body.status
  }

  // Role updates — only "user" | "admin"
  if (body.role !== undefined) {
    if (!['user', 'admin'].includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    if (target.role === 'admin' && body.role === 'user') {
      const adminCount = await db.user.count({ where: { role: 'admin' } })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last remaining admin' },
          { status: 400 },
        )
      }
    }
    data.role = body.role
  }

  try {
    const updated = await db.user.update({ where: { id }, data })
    return NextResponse.json({ item: updated })
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    throw err
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let current
  try {
    current = await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Cannot delete any admin
  if (target.role === 'admin') {
    return NextResponse.json(
      { error: 'Cannot delete an admin user' },
      { status: 400 },
    )
  }
  // Cannot delete yourself
  if (target.id === current.id) {
    return NextResponse.json(
      { error: 'You cannot delete your own account' },
      { status: 400 },
    )
  }

  // Delete the auth.users entry via the Supabase admin client.
  // The ON DELETE CASCADE on public."User" (set up in the trigger / migration)
  // removes the profile row automatically.
  const admin = createAdminSupabaseClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fallback: ensure the profile row is gone (in case cascade isn't set up)
  await db.user.delete({ where: { id } }).catch(() => {})

  return NextResponse.json({ ok: true })
}
