import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
export async function GET(req) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limit = parseInt(new URL(req.url).searchParams.get('limit') || '25')
  const notifs = await db('notifications').where({ user_id: user.id }).orderBy('created_at', 'desc').limit(limit)
  return NextResponse.json(notifs)
}
