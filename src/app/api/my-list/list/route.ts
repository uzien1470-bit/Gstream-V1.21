import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { movieToCard, seriesToCard } from '@/lib/content'
import type { ContentCardData } from '@/lib/types'

const MOVIE_SELECT =
  'id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, runtime, trending, popular, topRated, recentlyAdded, genres:Genre!Movie_genres(name)'
const SERIES_SELECT =
  'id, title, slug, synopsis, posterUrl, backdropUrl, logoUrl, releaseYear, rating, type, trending, popular, topRated, recentlyAdded, genres:Genre!Series_genres(name)'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ items: [] as ContentCardData[] })

    try {
      const supabase = await createServerSupabaseClient()
      const { data: rows, error: rowsErr } = await supabase
        .from('MyList')
        .select('id, movieId, seriesId, contentType, createdAt')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
      if (rowsErr) {
        console.error('[my-list/list] fetch failed:', rowsErr.message)
        return NextResponse.json({ items: [] })
      }

      if (!rows || rows.length === 0) {
        return NextResponse.json({ items: [] })
      }

      const cards: ContentCardData[] = []
      for (const it of rows as Array<{
        movieId: string | null
        seriesId: string | null
      }>) {
        if (it.movieId) {
          const { data: m, error: mErr } = await supabase
            .from('Movie')
            .select(MOVIE_SELECT)
            .eq('id', it.movieId)
            .maybeSingle()
          if (mErr) console.error('[my-list/list] movie fetch failed:', mErr.message)
          if (m) cards.push(movieToCard(m as never))
        } else if (it.seriesId) {
          const { data: s, error: sErr } = await supabase
            .from('Series')
            .select(SERIES_SELECT)
            .eq('id', it.seriesId)
            .maybeSingle()
          if (sErr) console.error('[my-list/list] series fetch failed:', sErr.message)
          if (s) cards.push(seriesToCard(s as never))
        }
      }
      return NextResponse.json({ items: cards })
    } catch (e) {
      console.error('[my-list/list] crashed:', (e as Error).message)
      return NextResponse.json({ items: [] })
    }
  } catch {
    return NextResponse.json({ items: [] })
  }
}
