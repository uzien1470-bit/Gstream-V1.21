import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
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
      // Guests: silently ignore — no session to track against
      return NextResponse.json({ ok: true })
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

      // Upsert against the composite unique key
      // (userId, movieId, seriesId, episodeId). This eliminates the
      // select-then-insert/update race condition.
      const row: Record<string, unknown> = {
        userId: user.id,
        contentType,
        progress,
        duration: duration ?? 0,
        position: position ?? 0,
      }
      if (isMovie) row.movieId = contentId
      else row.seriesId = contentId
      if (episodeId) row.episodeId = episodeId

      const { error: upsertErr } = await supabase
        .from('WatchProgress')
        .upsert(row, { onConflict: 'userId,movieId,seriesId,episodeId' })
      if (upsertErr) {
        console.error('[watch/progress] upsert failed:', upsertErr.message)
        // Non-fatal for UX — don't break playback, but surface the error server-side
      }

      // Best-effort WatchHistory insert (append-only; duplicates are fine —
      // they represent multiple watch sessions). Errors are logged but ignored.
      const hist: Record<string, unknown> = {
        userId: user.id,
        contentType,
      }
      if (isMovie) hist.movieId = contentId
      else hist.seriesId = contentId
      if (episodeId) hist.episodeId = episodeId
      const { error: histErr } = await supabase.from('WatchHistory').insert(hist)
      if (histErr) {
        // PGRST116 / 23505 expected on duplicate — only log unexpected errors
        if (histErr.code !== '23505') {
          console.error('[watch/progress] history insert:', histErr.message)
        }
      }

      return NextResponse.json({ ok: true })
    } catch (e) {
      console.error('[watch/progress] crashed:', (e as Error).message)
      return NextResponse.json({ ok: true })
    }
  } catch {
    return NextResponse.json({ ok: true })
  }
}
