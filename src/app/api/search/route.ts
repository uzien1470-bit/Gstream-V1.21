import { NextRequest, NextResponse } from 'next/server'
import { searchContent } from '@/lib/content'
import type { ContentType } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const type = (searchParams.get('type') ?? 'all') as ContentType | 'all'
  const genre = searchParams.get('genre') ?? undefined
  const yearStr = searchParams.get('year')
  const year = yearStr ? Number(yearStr) : undefined

  const items = await searchContent(q, { type, genre, year })
  return NextResponse.json({ items })
}
