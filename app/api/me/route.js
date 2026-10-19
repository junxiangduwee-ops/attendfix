import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only count personal notifications for My Attendance badge
  // missing_record = their own clock-in/out missing
  // request_rejected = their correction was rejected
  const [{ count }] = await db('notifications')
    .where({ user_id: user.id, is_read: false })
    .whereIn('type', ['missing_record', 'request_rejected'])
    .count('id as count')

  return NextResponse.json({ ...user, unreadCount: parseInt(count) })
}
