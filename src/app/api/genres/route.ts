import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const genres = await db.genre.findMany({ orderBy: { name: 'asc' }, select: { name: true, slug: true } })
  return NextResponse.json({ genres })
}
