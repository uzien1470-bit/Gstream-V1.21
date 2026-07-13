import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params

  try {
    const supabase = createAdminSupabaseClient()
    const { data: ep, error } = await supabase
      .from('Episode')
      .select('*, servers:EpisodeServer(*, server:StreamingServer(*))')
      .eq('id', id)
      .maybeSingle()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!ep) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ item: ep })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  try {
    const supabase = createAdminSupabaseClient()
    const row = {
      episodeNumber: Number(body.episodeNumber),
      title: body.title,
      description: body.description ?? null,
      thumbnailUrl: body.thumbnailUrl ?? null,
      runtime: Number(body.runtime) || 0,
      airDate: body.airDate ?? null,
    }
    const { data: updated, error } = await supabase
      .from('Episode')
      .update(row)
      .eq('id', id)
      .select()
      .single()
    if (error || !updated) {
      return NextResponse.json(
        { error: error?.message ?? 'Episode not found' },
        { status: error ? 500 : 404 },
      )
    }

    // Replace servers
    await supabase.from('EpisodeServer').delete().eq('episodeId', id)
    const servers: any[] = Array.isArray(body.servers) ? body.servers : []
    for (const s of servers) {
      if (!s.serverId || !s.embedUrl) continue
      await supabase.from('EpisodeServer').insert({
        episodeId: id,
        serverId: s.serverId,
        embedUrl: s.embedUrl,
        quality: s.quality ?? 'Auto',
        priority: Number(s.priority) || 0,
        status: s.status ?? 'active',
      })
    }
    return NextResponse.json({ item: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params

  try {
    const supabase = createAdminSupabaseClient()
    const { error } = await supabase.from('Episode').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
