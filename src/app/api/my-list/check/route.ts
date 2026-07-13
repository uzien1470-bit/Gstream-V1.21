import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ inList: false })

    const { searchParams } = new URL(req.url)
    const contentId = searchParams.get('contentId')
    const contentType = searchParams.get('contentType')
    if (!contentId || !contentType) {
      return NextResponse.json({ inList: false })
    }

    try {
      const supabase = await createServerSupabaseClient()
      let query = supabase
        .from('MyList')
        .select('id')
        .eq('userId', user.id)
      if (contentType === 'movie') query = query.eq('movieId', contentId)
      else query = query.eq('seriesId', contentId)
      const { data, error } = await query.maybeSingle()
      if (error) {
        console.error('[my-list/check] query failed:', error.message)
        return NextResponse.json({ inList: false })
      }
      return NextResponse.json({ inList: Boolean(data) })
    } catch (e) {
      console.error('[my-list/check] crashed:', (e as Error).message)
      return NextResponse.json({ inList: false })
    }
  } catch {
    return NextResponse.json({ inList: false })
  }
}
