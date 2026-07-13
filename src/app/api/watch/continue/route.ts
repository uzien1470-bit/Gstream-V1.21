import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { movieToCard, seriesToCard } from '@/lib/content'
import type { ContentCardData } from '@/lib/types'

const MOVIE_SELECT =
  'id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, runtime, trending, popular, topRated, recentlyAdded, genres!Movie_genres(name)'
const SERIES_SELECT =
  'id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, type, trending, popular, topRated, recentlyAdded, genres!Series_genres(name)'

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
      const { data: progressRows } = await supabase
        .from('WatchProgress')
        .select(
          'id, movieId, seriesId, episodeId, contentType, progress, updatedAt',
        )
        .eq('userId', user.id)
        .lt('progress', 95)
        .order('updatedAt', { ascending: false })
        .limit(20)

      if (!progressRows || progressRows.length === 0) {
        return NextResponse.json({ items: [] })
      }

      const items: (ContentCardData & {
        progress: number
        episodeId?: string | null
      })[] = []

      for (const p of progressRows as ProgressRow[]) {
        if (p.movieId) {
          const { data: m } = await supabase
            .from('Movie')
            .select(MOVIE_SELECT)
            .eq('id', p.movieId)
            .maybeSingle()
          if (m) {
            items.push({
              ...movieToCard(m as never),
              progress: p.progress,
              episodeId: null,
            })
          }
        } else if (p.seriesId) {
          const { data: s } = await supabase
            .from('Series')
            .select(SERIES_SELECT)
            .eq('id', p.seriesId)
            .maybeSingle()
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
    } catch {
      return NextResponse.json({ items: [] })
    }
  } catch {
    return NextResponse.json({ items: [] })
  }
}
