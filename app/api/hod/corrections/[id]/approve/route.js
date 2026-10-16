import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
export async function POST(req, { params }) {
  const user = await getUser()
  if (!user || !['HOD','ADMIN'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const cr = await db('correction_requests as cr').join('users as u','u.id','cr.user_id').select(db.raw('cr.*'),db.raw('u.hod_id as employee_hod_id')).where('cr.id', parseInt(id)).first()
  if (!cr) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (cr.status !== 'PENDING') return NextResponse.json({ error: 'Already decided.' }, { status: 409 })
  if (user.role === 'HOD' && cr.employee_hod_id !== user.id) return NextResponse.json({ error: 'Not your employee.' }, { status: 403 })
  const field = cr.field_missing === 'clock_in' ? 'clock_in' : 'clock_out'
  await db.transaction(async trx => {
    await trx('correction_requests').where({ id: cr.id }).update({ status: 'APPROVED', hod_id: user.id, decided_at: new Date() })
    await trx('attendance').where({ id: cr.attendance_id }).update({ [field]: cr.proposed_time, source: 'CORRECTED' })
    await trx('notifications').where({ user_id: user.id, type: 'approval_needed', ref_id: cr.id }).update({ is_read: true })
    await trx('notifications').where({ user_id: cr.user_id, type: 'missing_record', ref_id: cr.attendance_id }).update({ is_read: true })
    await trx('notifications').insert({ user_id: cr.user_id, type: 'request_approved', title: 'Correction approved ✓', message: `Your ${cr.field_missing.replace('_',' ')} correction for ${cr.date} was approved. Updated to ${cr.proposed_time}.`, ref_id: cr.id })
    await trx('audit_logs').insert({ actor_id: user.id, action: 'APPROVE_CORRECTION', target: `cr:${cr.id}`, detail: `${cr.date} ${cr.field_missing} → ${cr.proposed_time}` })
  })
  return NextResponse.json({ ok: true })
}
