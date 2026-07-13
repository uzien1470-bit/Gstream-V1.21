import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { movieToCard, seriesToCard } from '@/lib/content'
import type { ContentCardData } from '@/lib/types'

const MOVIE_SELECT =
  'id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, runtime, trending, popular, topRated, recentlyAdded, genres!Movie_genres(name)'
const SERIES_SELECT =
  'id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, type, trending, popular, topRated, recentlyAdded, genres!Series_genres(name)'

interface HistoryRow {
  movieId: string | null
  seriesId: string | null
  episodeId: string | null
  watchedAt: string
}

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ items: [] as ContentCardData[] })

    try {
      const supabase = await createServerSupabaseClient()
      const { data: history } = await supabase
        .from('WatchHistory')
        .select('id, movieId, seriesId, episodeId, contentType, watchedAt')
        .eq('userId', user.id)
        .order('watchedAt', { ascending: false })
        .limit(60)

      if (!history || history.length === 0) {
        return NextResponse.json({ items: [] })
      }

      const seen = new Set<string>()
      const items: (ContentCardData & {
        episodeId?: string | null
        watchedAt: string
      })[] = []

      for (const h of history as HistoryRow[]) {
        const key = h.movieId ?? h.seriesId
        if (!key || seen.has(key)) continue
        seen.add(key)

        if (h.movieId) {
          const { data: m } = await supabase
            .from('Movie')
            .select(MOVIE_SELECT)
            .eq('id', h.movieId)
            .maybeSingle()
          if (m) {
            items.push({
              ...movieToCard(m as never),
              watchedAt: new Date(h.watchedAt).toISOString(),
            })
          }
        } else if (h.seriesId) {
          const { data: s } = await supabase
            .from('Series')
            .select(SERIES_SELECT)
            .eq('id', h.seriesId)
            .maybeSingle()
          if (s) {
            items.push({
              ...seriesToCard(s as never),
              episodeId: h.episodeId ?? undefined,
              watchedAt: new Date(h.watchedAt).toISOString(),
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
