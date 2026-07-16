import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('Avatar')
    .select('*')
    .order('displayOrder', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const body = await req.json().catch(() => null)
  if (!body || !body.name || !body.imageUrl) {
    return NextResponse.json({ error: 'Name and Image URL are required' }, { status: 400 })
  }
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('Avatar')
    .insert({
      name: String(body.name).trim(),
      imageUrl: String(body.imageUrl).trim(),
      displayOrder: Number(body.displayOrder) || 0,
      enabled: body.enabled !== false,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}
