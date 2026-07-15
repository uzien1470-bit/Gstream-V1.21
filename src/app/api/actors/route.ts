import { NextRequest, NextResponse } from 'next/server'
import { searchActors } from '@/lib/content'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const actors = await searchActors(q, 20)
  return NextResponse.json({ actors })
}
