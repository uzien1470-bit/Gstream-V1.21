import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20') || 20))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const supabase = createAdminSupabaseClient()
  let query = supabase.from('Actor').select('*', { count: 'exact' })
  if (q) query = query.or(`name.ilike.%${q}%`)
  query = query.order('createdAt', { ascending: false }).range(from, to)
  const { data, error, count } = await query
  if (error) {
    console.error('[admin/actors GET] error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ items: data ?? [], total: count ?? 0, page, limit })
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const body = await req.json().catch(() => null)
  if (!body || !body.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  const name = String(body.name).trim()
  const slug = (body.slug && slugify(String(body.slug))) || slugify(name)
  if (!slug) return NextResponse.json({ error: 'Could not generate slug' }, { status: 400 })

  const supabase = createAdminSupabaseClient()
  // Duplicate check by slug
  const { data: existing } = await supabase.from('Actor').select('id').eq('slug', slug).maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'An actor with this name/slug already exists' }, { status: 409 })
  }

  const { data: created, error } = await supabase
    .from('Actor')
    .insert({
      name,
      slug,
      profilePhotoUrl: body.profilePhotoUrl ?? null,
      heroPhotoUrl: body.heroPhotoUrl ?? null,
      biography: body.biography ?? null,
      birthday: body.birthday ?? null,
      birthPlace: body.birthPlace ?? null,
      nationality: body.nationality ?? null,
      status: body.status ?? 'published',
    })
    .select()
    .single()
  if (error) {
    console.error('[admin/actors POST] error:', error.message)
    return NextResponse.json({ error: error.message }, { status: error.code === '23505' ? 409 : 500 })
  }
  return NextResponse.json({ item: created })
}
