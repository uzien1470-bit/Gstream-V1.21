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

      // Find existing WatchProgress row.
      // We can't use upsert because episodeId is NULL for movies, and
      // PostgreSQL treats NULL as distinct in unique constraints — so
      // upsert would create a duplicate every time. Manual check instead.
      let findQuery = supabase
        .from('WatchProgress')
        .select('id')
        .eq('userId', user.id)
      if (isMovie) {
        findQuery = findQuery.eq('movieId', contentId).is('episodeId', null)
      } else {
        findQuery = findQuery.eq('seriesId', contentId)
        if (episodeId) {
          findQuery = findQuery.eq('episodeId', episodeId)
        } else {
          findQuery = findQuery.is('episodeId', null)
        }
      }
      const { data: existing, error: findErr } = await findQuery.maybeSingle()
      if (findErr) {
        console.error('[watch/progress] find existing:', findErr.message)
      }

      const fields: Record<string, unknown> = {
        progress,
        duration: duration ?? 0,
        position: position ?? 0,
        contentType,
      }

      if (existing) {
        // Update existing row
        const { error: updateErr } = await supabase
          .from('WatchProgress')
          .update(fields)
          .eq('id', (existing as any).id)
        if (updateErr) {
          console.error('[watch/progress] update:', updateErr.message)
        }
      } else {
        // Insert new row
        const insert: Record<string, unknown> = {
          userId: user.id,
          ...fields,
        }
        if (isMovie) insert.movieId = contentId
        else insert.seriesId = contentId
        if (episodeId) insert.episodeId = episodeId
        const { error: insertErr } = await supabase.from('WatchProgress').insert(insert)
        if (insertErr) {
          console.error('[watch/progress] insert:', insertErr.message)
        }
      }

      // WatchHistory: only insert if the last history entry for this content
      // was more than 5 minutes ago — prevents flooding history with the
      // same content when the user clicks back and forth quickly.
      let histQuery = supabase
        .from('WatchHistory')
        .select('watchedAt')
        .eq('userId', user.id)
        .order('watchedAt', { ascending: false })
        .limit(1)
      if (isMovie) {
        histQuery = histQuery.eq('movieId', contentId).is('episodeId', null)
      } else {
        histQuery = histQuery.eq('seriesId', contentId)
        if (episodeId) histQuery = histQuery.eq('episodeId', episodeId)
        else histQuery = histQuery.is('episodeId', null)
      }
      const { data: lastHist } = await histQuery.maybeSingle()
      const fiveMinAgo = Date.now() - 5 * 60 * 1000
      const shouldLogHistory =
        !lastHist || new Date((lastHist as any).watchedAt).getTime() < fiveMinAgo

      if (shouldLogHistory) {
        const hist: Record<string, unknown> = {
          userId: user.id,
          contentType,
        }
        if (isMovie) hist.movieId = contentId
        else hist.seriesId = contentId
        if (episodeId) hist.episodeId = episodeId
        const { error: histErr } = await supabase.from('WatchHistory').insert(hist)
        if (histErr && histErr.code !== '23505') {
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
