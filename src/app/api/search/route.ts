import { NextRequest, NextResponse } from 'next/server'
import { searchContent, searchActors } from '@/lib/content'
import type { ContentType } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const type = (searchParams.get('type') ?? 'all') as ContentType | 'all'
  const genre = searchParams.get('genre') ?? undefined
  const yearStr = searchParams.get('year')
  const year = yearStr ? Number(yearStr) : undefined

  const [items, actors] = await Promise.all([
    searchContent(q, { type, genre, year }),
    q.trim() ? searchActors(q, 6) : Promise.resolve([]),
  ])
  return NextResponse.json({ items, actors })
}
