import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
import XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

function parseFile(buffer, filename) {
  const ext = (filename||'').split('.').pop().toLowerCase()
  if (['xlsx','xls'].includes(ext)) {
    const wb = XLSX.read(buffer, { type:'buffer', cellDates:true })
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval:'' })
  }
  return parse(buffer.toString('utf8'), { columns:true, skip_empty_lines:true, trim:true })
}
function normaliseTime(val) {
  if (!val && val !== 0) return null
  if (typeof val === 'number') { const s=Math.round(val*86400),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}` }
  const str=String(val).trim(); if(!str) return null
  if (/^\d{1,2}:\d{2}$/.test(str)) return `${str}:00`
  return str
}
function normaliseDate(val) {
  if (!val) return null
  if (val instanceof Date) return val.toISOString().slice(0,10)
  const str=String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) { const [d,m,y]=str.split('/'); return `${y}-${m}-${d}` }
  const d=new Date(str); return isNaN(d) ? null : d.toISOString().slice(0,10)
}

export async function POST(req) {
  const user = await getUser()
  if (!user || !['HR','ADMIN'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!file) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    const buffer = Buffer.from(await file.arrayBuffer())
    let rows
    try { rows = parseFile(buffer, file.name) } catch(e) { return NextResponse.json({ error: `Could not read file: ${e.message}` }, { status: 400 }) }
    if (!rows.length) return NextResponse.json({ error: 'File is empty.' }, { status: 400 })
    let imported = 0; const errors = []
    for (const r of rows) {
      try {
        const staffId = String(r.staff_id||r.staffId||r['Staff ID']||'').trim()
        const date = normaliseDate(r.date||r.Date)
        const clock_in = normaliseTime(r.clock_in||r.clockIn||r['Clock In']||null)
        const clock_out = normaliseTime(r.clock_out||r.clockOut||r['Clock Out']||null)
        if (!staffId) throw new Error('staff_id missing')
        if (!date) throw new Error('date missing')
        const emp = await db('users').where({ staff_id: staffId }).first()
        if (!emp) throw new Error(`Staff ID "${staffId}" not found`)
        await db('attendance').insert({ user_id:emp.id, date, clock_in, clock_out, source:'HR_SYSTEM', synced_at:new Date() }).onConflict(['user_id','date']).merge({ clock_in, clock_out, synced_at:new Date(), updated_at:new Date() })
        imported++
      } catch(e) { errors.push({ row:r, error:e.message }) }
    }
    await db('hr_sync_log').insert({ direction:'pull', status:errors.length?'partial':'ok', records_affected:imported, detail:`File upload by user ${user.id}` })
    await db('audit_logs').insert({ actor_id:user.id, action:'FILE_IMPORT', detail:`Imported:${imported} Errors:${errors.length}` })
    return NextResponse.json({ imported, skipped:errors.length, errors })
  } catch(e) { console.error(e); return NextResponse.json({ error:'Server error.' }, { status:500 }) }
}
