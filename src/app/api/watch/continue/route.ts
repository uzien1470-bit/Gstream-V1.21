import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { movieToCard, seriesToCard } from '@/lib/content'
import type { ContentCardData } from '@/lib/types'

const MOVIE_SELECT =
  'id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, runtime, trending, popular, topRated, recentlyAdded, genres:Genre!Movie_genres(name)'
const SERIES_SELECT =
  'id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, type, trending, popular, topRated, recentlyAdded, genres:Genre!Series_genres(name)'

interface ProgressRow {
  movieId: string | null
  seriesId: string | null
  episodeId: string | null
  progress: number
}

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({
        items: [] as (ContentCardData & {
          progress: number
          episodeId?: string | null
        })[],
      })
    }

    try {
      const supabase = await createServerSupabaseClient()
      const { data: progressRows, error: pErr } = await supabase
        .from('WatchProgress')
        .select(
          'id, movieId, seriesId, episodeId, contentType, progress, updatedAt',
        )
        .eq('userId', user.id)
        .lt('progress', 95)
        .order('updatedAt', { ascending: false })
        .limit(20)
      if (pErr) {
        console.error('[watch/continue] fetch failed:', pErr.message)
        return NextResponse.json({ items: [] })
      }

      if (!progressRows || progressRows.length === 0) {
        return NextResponse.json({ items: [] })
      }

      const items: (ContentCardData & {
        progress: number
        episodeId?: string | null
      })[] = []

      for (const p of progressRows as ProgressRow[]) {
        if (p.movieId) {
          const { data: m, error: mErr } = await supabase
            .from('Movie')
            .select(MOVIE_SELECT)
            .eq('id', p.movieId)
            .maybeSingle()
          if (mErr) console.error('[watch/continue] movie fetch failed:', mErr.message)
          if (m) {
            items.push({
              ...movieToCard(m as never),
              progress: p.progress,
              episodeId: null,
            })
          }
        } else if (p.seriesId) {
          const { data: s, error: sErr } = await supabase
            .from('Series')
            .select(SERIES_SELECT)
            .eq('id', p.seriesId)
            .maybeSingle()
          if (sErr) console.error('[watch/continue] series fetch failed:', sErr.message)
          if (s) {
            items.push({
              ...seriesToCard(s as never),
              progress: p.progress,
              episodeId: p.episodeId ?? null,
            })
          }
        }
      }
      return NextResponse.json({ items })
    } catch (e) {
      console.error('[watch/continue] crashed:', (e as Error).message)
      return NextResponse.json({ items: [] })
    }
  } catch {
    return NextResponse.json({ items: [] })
  }
}
