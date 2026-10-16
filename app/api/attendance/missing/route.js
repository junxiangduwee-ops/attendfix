import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const today = new Date().toISOString().slice(0,10)
  const thirtyAgo = new Date(Date.now()-30*86400000).toISOString().slice(0,10)
  const records = await db('attendance').where({ user_id: user.id }).whereBetween('date', [thirtyAgo, today]).where(function(){ this.whereNull('clock_in').orWhereNull('clock_out') }).orderBy('date', 'desc')
  const result = await Promise.all(records.map(async r => {
    const req = await db('correction_requests').where({ attendance_id: r.id, status: 'PENDING' }).first()
    return { ...r, req_status: req?.status || null }
  }))
  return NextResponse.json(result)
}
