import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('Avatar')
      .select('id, name, imageUrl, displayOrder, enabled')
      .eq('enabled', true)
      .order('displayOrder', { ascending: true })
    if (error) {
      console.error('[avatars] fetch failed:', error.message)
      return NextResponse.json({ avatars: [] })
    }
    return NextResponse.json({ avatars: data ?? [] })
  } catch {
    return NextResponse.json({ avatars: [] })
  }
}
