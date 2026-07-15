import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('Genre')
      .select('id, name, slug')
      .order('name', { ascending: true })
    if (error || !data) {
      return NextResponse.json({ genres: [] })
    }
    return NextResponse.json({ genres: data as { id: string; name: string; slug: string }[] })
  } catch {
    return NextResponse.json({ genres: [] })
  }
}
