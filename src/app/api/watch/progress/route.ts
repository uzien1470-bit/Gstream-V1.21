import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  contentId: z.string(),
  contentType: z.enum(['movie', 'series', 'anime']),
  episodeId: z.string().nullable().optional(),
  progress: z.number().min(0).max(100),
  duration: z.number().int().nonnegative().optional(),
  position: z.number().int().nonnegative().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ ok: true }) // silently ignore for guests
    }
    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    const { contentId, contentType, episodeId, progress, duration, position } =
      parsed.data
    const isMovie = contentType === 'movie'

    try {
      const supabase = await createServerSupabaseClient()

      // Look up an existing WatchProgress row (composite key:
      // userId + movieId/seriesId + episodeId).
      let existingQuery = supabase
        .from('WatchProgress')
        .select('id')
        .eq('userId', user.id)
      if (isMovie) {
        existingQuery = existingQuery.eq('movieId', contentId)
      } else {
        existingQuery = existingQuery.eq('seriesId', contentId)
      }
      if (episodeId) {
        existingQuery = existingQuery.eq('episodeId', episodeId)
      } else {
        existingQuery = existingQuery.is('episodeId', null)
      }
      const { data: existing } = await existingQuery.maybeSingle()

      const fields: Record<string, unknown> = {
        progress,
        duration: duration ?? 0,
        position: position ?? 0,
        contentType,
      }

      if (existing) {
        await supabase
          .from('WatchProgress')
          .update(fields)
          .eq('id', (existing as { id: string }).id)
      } else {
        const insert: Record<string, unknown> = {
          userId: user.id,
          ...fields,
        }
        if (isMovie) insert.movieId = contentId
        else insert.seriesId = contentId
        if (episodeId) insert.episodeId = episodeId
        await supabase.from('WatchProgress').insert(insert)
      }

      // Best-effort WatchHistory insert
      try {
        const hist: Record<string, unknown> = {
          userId: user.id,
          contentType,
        }
        if (isMovie) hist.movieId = contentId
        else hist.seriesId = contentId
        if (episodeId) hist.episodeId = episodeId
        await supabase.from('WatchHistory').insert(hist)
      } catch {
        // ignore — best-effort
      }

      return NextResponse.json({ ok: true })
    } catch {
      return NextResponse.json({ ok: true })
    }
  } catch {
    return NextResponse.json({ ok: true })
  }
}
