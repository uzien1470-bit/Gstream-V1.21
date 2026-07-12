import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { token, password } = parsed.data

  const record = await db.passwordToken.findUnique({ where: { token } })
  if (!record || record.used || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)
  await db.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  })
  await db.passwordToken.update({
    where: { id: record.id },
    data: { used: true },
  })
  // Invalidate all sessions for this user
  await db.session.deleteMany({ where: { userId: record.userId } })

  return NextResponse.json({ ok: true })
}
