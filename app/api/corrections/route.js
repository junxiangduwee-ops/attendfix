import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const reqs = await db('correction_requests').where({ user_id: user.id }).orderBy('created_at', 'desc')
  return NextResponse.json(reqs)
}
export async function POST(req) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { date, fieldMissing: fm, proposedTime, justification, evidence } = await req.json()
    const field_missing = fm === 'clockIn' ? 'clock_in' : fm === 'clockOut' ? 'clock_out' : fm
    if (!['clock_in','clock_out'].includes(field_missing)) return NextResponse.json({ error: 'Invalid field.' }, { status: 400 })
    if (!date || !proposedTime || !justification) return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    const dup = await db('correction_requests').where({ user_id: user.id, date, field_missing, status: 'PENDING' }).first()
    if (dup) return NextResponse.json({ error: 'A pending request already exists.' }, { status: 409 })
    const att = await db('attendance').where({ user_id: user.id, date }).first()
    if (!att) return NextResponse.json({ error: 'No attendance record found for this date.' }, { status: 404 })
    const [cr] = await db('correction_requests').insert({ user_id: user.id, attendance_id: att.id, date, field_missing, proposed_time: proposedTime, justification, evidence: evidence || null }).returning('*')
    const fullUser = await db('users').where({ id: user.id }).first()
    if (fullUser?.hod_id) await db('notifications').insert({ user_id: fullUser.hod_id, type: 'approval_needed', title: `Correction request — ${fullUser.name}`, message: `${fullUser.name} submitted a correction for ${date} (${field_missing.replace('_',' ')}). Proposed: ${proposedTime}.`, ref_id: cr.id })
    await db('notifications').insert({ user_id: user.id, type: 'request_submitted', title: 'Correction request submitted', message: `Your request for ${date} (${field_missing.replace('_',' ')}) has been sent to your HOD. Proposed: ${proposedTime}.`, ref_id: cr.id })
    await db('audit_logs').insert({ actor_id: user.id, action: 'SUBMIT_CORRECTION', target: `cr:${cr.id}`, detail: `${date} ${field_missing} → ${proposedTime}` })
    return NextResponse.json(cr)
  } catch(e) { console.error(e); return NextResponse.json({ error: 'Server error.' }, { status: 500 }) }
}
