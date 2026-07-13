import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  let current
  try {
    current = await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  try {
    const supabase = createAdminSupabaseClient()

    let query = supabase
      .from('User')
      .select('id, email, name, avatarUrl, role, status, createdAt, updatedAt', { count: 'exact' })
      .order('createdAt', { ascending: false })

    if (q) {
      query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`)
    }

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: items, count, error } = await query.range(from, to)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      items: items ?? [],
      total: count ?? 0,
      page,
      limit: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
      currentUserId: current.id,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
