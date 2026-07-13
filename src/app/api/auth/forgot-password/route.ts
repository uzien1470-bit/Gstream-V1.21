import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  // Supabase sends a password-reset email; the redirect URL points to the
  // in-app reset page that reads the token from the query string.
  const origin = req.nextUrl.origin
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  })

  // Always respond ok to avoid leaking which emails exist
  return NextResponse.json({
    ok: true,
    message: 'If an account exists, a reset link has been sent.',
  })
}
