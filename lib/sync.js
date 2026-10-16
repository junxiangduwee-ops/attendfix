import { db } from './db.js'
import { notifyMissingRecord } from './email.js'

const adapter = (await import('./hrAdapter.js')).default

function todayStr() { return new Date().toISOString().slice(0,10) }
function getDateRange(from, to) {
  const dates = [], d = new Date(from+'T00:00:00'), end = new Date(to+'T00:00:00')
  while (d <= end) { dates.push(d.toISOString().slice(0,10)); d.setDate(d.getDate()+1) }
  return dates
}
function formatDate(d) { return new Date(d+'T00:00').toLocaleDateString('en-MY',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) }

export async function pullFromHR(date = todayStr(), dateTo = null) {
  const dates = dateTo ? getDateRange(date, dateTo) : [date]
  const log = { direction:'pull', status:'ok', records_affected:0, detail: dates.length>1?`range=${date}→${dateTo}`:`date=${date}` }
  try {
    const employees = await db('users').whereIn('role',['EMPLOYEE','HOD']).where({ is_active:true }).select('id','staff_id')
    const staffIds = employees.map(e => e.staff_id)
    const empMap = Object.fromEntries(employees.map(e => [e.staff_id, e.id]))
    for (const d of dates) {
      const records = await adapter.fetchAttendance(d, staffIds)
      for (const r of records) {
        const userId = empMap[r.staffId]; if (!userId) continue
        await db('attendance').insert({ user_id:userId, date:r.date, clock_in:r.clockIn||null, clock_out:r.clockOut||null, source:'HR_SYSTEM', hr_record_id:r.hrRecordId||null, synced_at:new Date() })
          .onConflict(['user_id','date']).merge({ clock_in:db.raw(`CASE WHEN attendance.source = 'CORRECTED' THEN attendance.clock_in ELSE EXCLUDED.clock_in END`), clock_out:db.raw(`CASE WHEN attendance.source = 'CORRECTED' THEN attendance.clock_out ELSE EXCLUDED.clock_out END`), synced_at:new Date(), updated_at:new Date() })
        log.records_affected++
      }
    }
  } catch(e) { log.status='failed'; log.error=e.message; console.error('[SYNC] pullFromHR failed:', e.message) }
  await db('hr_sync_log').insert(log)
  return log
}

export async function detectMissing(date = todayStr(), dateTo = null) {
  const dates = dateTo ? getDateRange(date, dateTo) : [date]
  let notified = 0
  try {
    const employees = await db('users').whereIn('role',['EMPLOYEE','HOD']).where({ is_active:true })
    for (const d of dates) {
      for (const emp of employees) {
        const att = await db('attendance').where({ user_id:emp.id, date:d }).first()
        if (att?.clock_in && att?.clock_out) continue
        const missingField = att?.clock_in ? 'clock_out' : 'clock_in'
        const alreadyNotified = await db('notifications').where({ user_id:emp.id, type:'missing_record', ref_id:att?.id||null }).where('created_at','>=',d).first()
        if (alreadyNotified) continue
        let attRow = att
        if (!attRow) {
          const [inserted] = await db('attendance').insert({ user_id:emp.id, date:d, source:'HR_SYSTEM', synced_at:new Date() }).onConflict(['user_id','date']).ignore().returning('*')
          attRow = inserted || await db('attendance').where({ user_id:emp.id, date:d }).first()
        }
        await db('notifications').insert({ user_id:emp.id, type:'missing_record', title:`Missing ${missingField.replace('_','-')} — ${formatDate(d)}`, message:`Your ${missingField.replace('_',' ')} was not recorded for ${formatDate(d)}. Please submit a correction within 48 hours.`, ref_id:attRow?.id||null })
        const hod = emp.hod_id ? await db('users').where({ id:emp.hod_id }).first() : null
        if (hod) await db('notifications').insert({ user_id:hod.id, type:'team_missing_record', title:`Missing record — ${emp.name}`, message:`${emp.name} (${emp.staff_id}) has a missing ${missingField.replace('_',' ')} on ${formatDate(d)}.`, ref_id:attRow?.id||null })
        try { await notifyMissingRecord(emp, d, hod) } catch(e) { console.error('[SYNC] Email error:', e.message) }
        notified++
      }
    }
  } catch(e) { console.error('[SYNC] detectMissing error:', e.message) }
  return { notified, dates: dates.length }
}

export async function retryFailedPushes() { return { retried: 0 } }
export async function syncEmployees() { return { synced: 0 } }
export async function pushCorrectionToHR() { return { ok: true } }
