import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const today = new Date().toISOString().slice(0,10)
  const month = today.slice(0,7)
  const [p, m, pend] = await Promise.all([
    db('attendance').where({ user_id: user.id }).whereLike('date', `${month}%`).whereNotNull('clock_in').whereNotNull('clock_out').count('id as c').then(r => parseInt(r[0].c)),
    db('attendance').where({ user_id: user.id }).where('date', '<', today).where(function(){ this.whereNull('clock_in').orWhereNull('clock_out') }).count('id as c').then(r => parseInt(r[0].c)),
    db('correction_requests').where({ user_id: user.id, status: 'PENDING' }).count('id as c').then(r => parseInt(r[0].c))
  ])
  return NextResponse.json({ present: p, missing: m, pending: pend })
}
