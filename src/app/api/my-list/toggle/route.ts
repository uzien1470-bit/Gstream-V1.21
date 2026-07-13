import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const schema = z.object({
  contentId: z.string(),
  contentType: z.enum(['movie', 'series', 'anime']),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    const { contentId, contentType } = parsed.data
    const isMovie = contentType === 'movie'

    try {
      const supabase = await createServerSupabaseClient()

      // Check if already in list
      let existingQuery = supabase
        .from('MyList')
        .select('id')
        .eq('userId', user.id)
      if (isMovie) existingQuery = existingQuery.eq('movieId', contentId)
      else existingQuery = existingQuery.eq('seriesId', contentId)
      const { data: existing } = await existingQuery.maybeSingle()

      if (existing) {
        await supabase
          .from('MyList')
          .delete()
          .eq('id', (existing as { id: string }).id)
        return NextResponse.json({ inList: false })
      }

      // Verify content exists in Movie or Series table
      const table = isMovie ? 'Movie' : 'Series'
      const { data: content } = await supabase
        .from(table)
        .select('id')
        .eq('id', contentId)
        .maybeSingle()
      if (!content) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      const row: Record<string, string> = {
        userId: user.id,
        contentType,
      }
      if (isMovie) row.movieId = contentId
      else row.seriesId = contentId

      const { error: insertError } = await supabase.from('MyList').insert(row)
      if (insertError) {
        return NextResponse.json({ error: 'Failed to add' }, { status: 500 })
      }

      return NextResponse.json({ inList: true })
    } catch {
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
