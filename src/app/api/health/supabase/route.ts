import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase/configured'

export async function GET() {
  return NextResponse.json({ configured: isSupabaseConfigured() })
}
