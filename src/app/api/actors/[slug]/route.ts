import { NextRequest, NextResponse } from 'next/server'
import { getActorDetail } from '@/lib/content'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const actor = await getActorDetail(slug)
  if (!actor) {
    return NextResponse.json({ error: 'Actor not found' }, { status: 404 })
  }
  return NextResponse.json({ actor })
}
