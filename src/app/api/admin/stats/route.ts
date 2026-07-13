import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

async function countRows(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  table: string,
  filter?: { column: string; value: string | boolean },
): Promise<number> {
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filter) q = q.eq(filter.column, filter.value)
  const { count, error } = await q
  if (error || count === null) return 0
  return count
}

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminSupabaseClient()

    const [
      movies, series, anime, seasons, episodes, genres, categories,
      servers, banners, users, activeUsers, suspendedUsers, myListCount,
      historyCount, progressCount,
    ] = await Promise.all([
      countRows(supabase, 'Movie'),
      countRows(supabase, 'Series', { column: 'type', value: 'series' }),
      countRows(supabase, 'Series', { column: 'type', value: 'anime' }),
      countRows(supabase, 'Season'),
      countRows(supabase, 'Episode'),
      countRows(supabase, 'Genre'),
      countRows(supabase, 'Category'),
      countRows(supabase, 'StreamingServer'),
      countRows(supabase, 'FeaturedBanner', { column: 'active', value: true }),
      countRows(supabase, 'User'),
      countRows(supabase, 'User', { column: 'status', value: 'active' }),
      countRows(supabase, 'User', { column: 'status', value: 'suspended' }),
      countRows(supabase, 'MyList'),
      countRows(supabase, 'WatchHistory'),
      countRows(supabase, 'WatchProgress'),
    ])

    // Recent activity (last 10 watch history) with nested user/movie/series/episode
    let recentActivity: any[] = []
    try {
      const { data, error } = await supabase
        .from('WatchHistory')
        .select(
          'id, watchedAt, contentType, user:User(name, email), movie:Movie(title), series:Series(title), episode:Episode(title, episodeNumber)',
        )
        .order('watchedAt', { ascending: false })
        .limit(10)
      if (!error && data) recentActivity = data as any[]
    } catch {
      recentActivity = []
    }

    return NextResponse.json({
      stats: {
        movies, series, anime, seasons, episodes, genres, categories,
        servers, banners, users, activeUsers, suspendedUsers,
        myListCount, historyCount, progressCount,
      },
      recentActivity: recentActivity.map((a: any) => ({
        id: a.id,
        watchedAt: a.watchedAt ? new Date(a.watchedAt).toISOString() : null,
        user: a.user?.name || a.user?.email || 'Unknown',
        title: a.movie?.title ?? a.series?.title ?? 'Unknown',
        episode: a.episode ? `E${a.episode.episodeNumber} · ${a.episode.title}` : null,
        contentType: a.contentType,
      })),
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Server error' },
      { status: 500 },
    )
  }
}
