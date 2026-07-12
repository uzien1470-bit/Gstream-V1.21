import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  const email = parsed.data.email.toLowerCase()

  const user = await db.user.findUnique({ where: { email } })
  // Always respond ok to avoid leaking which emails exist
  if (user) {
    await db.passwordToken.deleteMany({ where: { userId: user.id } })
    const token = crypto.randomBytes(32).toString('hex')
    await db.passwordToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })
    // In production this would email the user. For this demo we surface the token.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Password reset token for ${email}: ${token}`)
    }
  }
  return NextResponse.json({
    ok: true,
    message: 'If an account exists, a reset link has been sent.',
  })
}
