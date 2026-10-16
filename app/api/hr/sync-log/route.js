import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
export async function GET() {
  const user = await getUser()
  if (!user || !['HR','ADMIN'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rows = await db('hr_sync_log').orderBy('created_at','desc').limit(50)
  return NextResponse.json(rows)
}
