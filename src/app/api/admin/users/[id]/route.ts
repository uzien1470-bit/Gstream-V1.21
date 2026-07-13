import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

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

  try {
    const supabase = createAdminSupabaseClient()

    const { data: target, error: targetErr } = await supabase
      .from('User')
      .select('id, role, status')
      .eq('id', id)
      .maybeSingle()
    if (targetErr) {
      return NextResponse.json({ error: targetErr.message }, { status: 500 })
    }
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
        const { count, error: countErr } = await supabase
          .from('User')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin')
        if (countErr) {
          return NextResponse.json({ error: countErr.message }, { status: 500 })
        }
        if ((count ?? 0) <= 1) {
          return NextResponse.json(
            { error: 'Cannot demote the last remaining admin' },
            { status: 400 },
          )
        }
      }
      data.role = body.role
    }

    const { data: updated, error } = await supabase
      .from('User')
      .update(data)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ item: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
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

  try {
    const supabase = createAdminSupabaseClient()

    const { data: target, error: targetErr } = await supabase
      .from('User')
      .select('id, role')
      .eq('id', id)
      .maybeSingle()
    if (targetErr) {
      return NextResponse.json({ error: targetErr.message }, { status: 500 })
    }
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
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Fallback: ensure the profile row is gone (in case cascade isn't set up)
    const { error: profileDelErr } = await supabase.from('User').delete().eq('id', id)
    if (profileDelErr) console.warn('[admin/users DELETE] profile cleanup:', profileDelErr.message)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
