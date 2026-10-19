import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
export async function GET() {
  const user = await getUser()
  if (!user || !['HOD','HR','ADMIN'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const today = new Date().toISOString().slice(0,10)
  const [p, t, m, hr] = await Promise.all([
    db('correction_requests as cr').join('users as u','u.id','cr.user_id').where('u.hod_id', user.id).where('cr.status','PENDING').count('cr.id as c').then(r => parseInt(r[0].c)),
    db('users').where({ hod_id: user.id, is_active: true }).count('id as c').then(r => parseInt(r[0].c)),
    db('attendance as a').join('users as u','u.id','a.user_id').where('u.hod_id', user.id).where('a.date','<',today).where(function(){ this.whereNull('a.clock_in').orWhereNull('a.clock_out') }).count('a.id as c').then(r => parseInt(r[0].c)),
    db('correction_requests as cr').join('users as u','u.id','cr.user_id').where('u.hod_id', user.id).where({ 'cr.status':'APPROVED', 'cr.hr_synced':false }).count('cr.id as c').then(r => parseInt(r[0].c)),
  ])
  return NextResponse.json({ pending: p, teamSize: t, missingCount: m, hrPendingSync: hr })
}
