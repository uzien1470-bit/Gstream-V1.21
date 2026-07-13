import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
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

    // Build the update row CONDITIONALLY so a partial update does NOT reset
    // every omitted field to its default value.
    const row: any = {}
    if (body.episodeNumber !== undefined) row.episodeNumber = Number(body.episodeNumber)
    if (body.title !== undefined) row.title = body.title
    if (body.description !== undefined) row.description = body.description
    if (body.thumbnailUrl !== undefined) row.thumbnailUrl = body.thumbnailUrl
    if (body.runtime !== undefined) row.runtime = Number(body.runtime)
    if (body.airDate !== undefined) row.airDate = body.airDate

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

    // Replace servers (only if provided in the request body)
    if (Array.isArray(body.servers)) {
      const { error: sDelErr } = await supabase.from('EpisodeServer').delete().eq('episodeId', id)
      if (sDelErr) {
        console.error('[admin/episodes PUT] EpisodeServer delete:', sDelErr.message)
        return NextResponse.json({ error: 'Failed to clear servers: ' + sDelErr.message }, { status: 500 })
      }
      for (const s of body.servers) {
        if (!s.serverId || !s.embedUrl) continue
        const { error: sInsErr } = await supabase.from('EpisodeServer').insert({
          episodeId: id,
          serverId: s.serverId,
          embedUrl: s.embedUrl,
          quality: s.quality ?? 'Auto',
          priority: Number(s.priority) || 0,
          status: s.status ?? 'active',
        })
        if (sInsErr) {
          console.error('[admin/episodes PUT] EpisodeServer insert:', sInsErr.message)
          return NextResponse.json({ error: 'Failed to link server: ' + sInsErr.message }, { status: 500 })
        }
      }
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
    const { error, count } = await supabase.from('Episode').delete({ count: 'exact' }).eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
