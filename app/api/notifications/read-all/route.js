import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db('notifications').where({ user_id: user.id }).update({ is_read: true })
  return NextResponse.json({ ok: true })
}
