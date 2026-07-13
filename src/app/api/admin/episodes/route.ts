import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { searchParams } = new URL(req.url)
  const seasonId = searchParams.get('seasonId')

  try {
    const supabase = createAdminSupabaseClient()

    let query = supabase
      .from('Episode')
      .select('*, season:Season(*, series:Series(id, title, type)), servers:EpisodeServer(*, server:StreamingServer(*))')
      .order('seasonId', { ascending: true })
      .order('episodeNumber', { ascending: true })
      .limit(200)

    if (seasonId) query = query.eq('seasonId', seasonId)

    const { data: episodes, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ items: episodes ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  try {
    const supabase = createAdminSupabaseClient()

    // Verify the season exists
    const { data: season, error: seasonErr } = await supabase
      .from('Season')
      .select('id')
      .eq('id', body.seasonId)
      .maybeSingle()
    if (seasonErr || !season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    const row = {
      seasonId: body.seasonId,
      episodeNumber: Number(body.episodeNumber),
      title: body.title,
      description: body.description ?? null,
      thumbnailUrl: body.thumbnailUrl ?? null,
      runtime: Number(body.runtime) || 0,
      airDate: body.airDate ?? null,
    }
    const { data: created, error } = await supabase
      .from('Episode')
      .insert(row)
      .select()
      .single()
    if (error || !created) {
      return NextResponse.json(
        { error: error?.message ?? 'Failed to create episode' },
        { status: 500 },
      )
    }

    // Attach servers
    const servers: any[] = Array.isArray(body.servers) ? body.servers : []
    for (const s of servers) {
      if (!s.serverId || !s.embedUrl) continue
      await supabase.from('EpisodeServer').insert({
        episodeId: created.id,
        serverId: s.serverId,
        embedUrl: s.embedUrl,
        quality: s.quality ?? 'Auto',
        priority: Number(s.priority) || 0,
        status: s.status ?? 'active',
      })
    }

    return NextResponse.json({ item: created })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
