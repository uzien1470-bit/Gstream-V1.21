import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ inList: false })

  const { searchParams } = new URL(req.url)
  const contentId = searchParams.get('contentId')
  const contentType = searchParams.get('contentType')
  if (!contentId || !contentType) {
    return NextResponse.json({ inList: false })
  }

  const where: any = { userId: user.id }
  if (contentType === 'movie') where.movieId = contentId
  else where.seriesId = contentId

  const item = await db.myList.findFirst({ where })
  return NextResponse.json({ inList: Boolean(item) })
}
