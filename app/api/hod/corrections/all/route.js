import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
export async function GET(req) {
  const user = await getUser()
  if (!user || !['HOD','HR','ADMIN'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status'), from = searchParams.get('from'), to = searchParams.get('to')
  let q = db('correction_requests as cr').join('users as u','u.id','cr.user_id').leftJoin('users as h','h.id','cr.hod_id')
    .select(db.raw('cr.id'),db.raw('cr.date'),db.raw('cr.field_missing'),db.raw('cr.proposed_time'),db.raw('cr.justification'),db.raw('cr.evidence'),db.raw('cr.status'),db.raw('cr.hod_remarks'),db.raw('cr.decided_at'),db.raw('cr.created_at'),db.raw('u.name as employee_name'),db.raw('u.staff_id as staff_id'),db.raw('u.department as department'),db.raw('h.name as hod_name'))
    .orderBy('cr.created_at','desc')
  if (user.role === 'HOD') q = q.where('u.hod_id', user.id)
  if (status) q = q.where('cr.status', status)
  if (from && to) q = q.whereBetween('cr.date', [from, to])
  else if (from) q = q.where('cr.date', '>=', from)
  else if (to) q = q.where('cr.date', '<=', to)
  const rows = await q
  return NextResponse.json({ rows, total: rows.length })
}
