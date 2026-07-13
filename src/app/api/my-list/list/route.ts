import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { movieToCard, seriesToCard } from '@/lib/content'
import type { ContentCardData } from '@/lib/types'

const MOVIE_SELECT =
  'id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, runtime, trending, popular, topRated, recentlyAdded, genres!Movie_genres(name)'
const SERIES_SELECT =
  'id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, type, trending, popular, topRated, recentlyAdded, genres!Series_genres(name)'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ items: [] as ContentCardData[] })

    try {
      const supabase = await createServerSupabaseClient()
      const { data: rows } = await supabase
        .from('MyList')
        .select('id, movieId, seriesId, contentType, createdAt')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })

      if (!rows || rows.length === 0) {
        return NextResponse.json({ items: [] })
      }

      const cards: ContentCardData[] = []
      for (const it of rows as Array<{
        movieId: string | null
        seriesId: string | null
      }>) {
        if (it.movieId) {
          const { data: m } = await supabase
            .from('Movie')
            .select(MOVIE_SELECT)
            .eq('id', it.movieId)
            .maybeSingle()
          if (m) cards.push(movieToCard(m as never))
        } else if (it.seriesId) {
          const { data: s } = await supabase
            .from('Series')
            .select(SERIES_SELECT)
            .eq('id', it.seriesId)
            .maybeSingle()
          if (s) cards.push(seriesToCard(s as never))
        }
      }
      return NextResponse.json({ items: cards })
    } catch {
      return NextResponse.json({ items: [] })
    }
  } catch {
    return NextResponse.json({ items: [] })
  }
}
