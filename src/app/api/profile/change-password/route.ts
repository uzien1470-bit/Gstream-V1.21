import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, verifyPassword, hashPassword } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const full = await db.user.findUnique({ where: { id: user.id } })
  if (!full) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ok = await verifyPassword(parsed.data.currentPassword, full.passwordHash)
  if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

  const passwordHash = await hashPassword(parsed.data.newPassword)
  await db.user.update({ where: { id: user.id }, data: { passwordHash } })
  // invalidate other sessions
  await db.session.deleteMany({ where: { userId: user.id } })

  return NextResponse.json({ ok: true })
}
