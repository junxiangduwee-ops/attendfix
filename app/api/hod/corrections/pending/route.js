import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
export async function GET() {
  const user = await getUser()
  if (!user || !['HOD','HR','ADMIN'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  let q = db('correction_requests as cr').join('users as u','u.id','cr.user_id').join('attendance as a','a.id','cr.attendance_id')
    .select(db.raw('cr.id as id'),db.raw('cr.user_id as user_id'),db.raw('cr.attendance_id as attendance_id'),db.raw('cr.date as date'),db.raw('cr.field_missing as field_missing'),db.raw('cr.proposed_time as proposed_time'),db.raw('cr.justification as justification'),db.raw('cr.evidence as evidence'),db.raw('cr.status as status'),db.raw('cr.hod_id as hod_id'),db.raw('cr.hod_remarks as hod_remarks'),db.raw('cr.decided_at as decided_at'),db.raw('cr.created_at as created_at'),db.raw('u.name as employee_name'),db.raw('u.staff_id as staff_id'),db.raw('u.department as department'),db.raw('u.email as email'),db.raw('u.hod_id as employee_hod_id'))
    .where('cr.status','PENDING')
  if (user.role === 'HOD') q = q.where('u.hod_id', user.id)
  const rows = await q.orderBy('cr.created_at','asc')
  return NextResponse.json(rows)
}
