'use client'
import { useEffect, useState } from 'react'

function fmtDate(d) { if(!d) return '—'; return new Date(d+'T00:00').toLocaleDateString('en-MY',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) }
function fmtDateTime(d) { if(!d) return '—'; return new Date(d).toLocaleString('en-MY',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) }
function attendanceBadge(r) {
  if (!r.clockIn && !r.clockOut) return <span className="badge miss"><span className="badge-dot"></span>Missing</span>
  if (!r.clockIn) return <span className="badge miss"><span className="badge-dot"></span>No clock-in</span>
  if (!r.clockOut) return <span className="badge miss"><span className="badge-dot"></span>No clock-out</span>
  if (['CORRECTED','corrected'].includes(r.source)) return <span className="badge fill"><span className="badge-dot"></span>Corrected</span>
  return <span className="badge ok"><span className="badge-dot"></span>Complete</span>
}
function statusBadge(s) {
  const map = { PENDING:<span className="badge pend pulse"><span className="badge-dot"></span>Pending</span>, APPROVED:<span className="badge ok"><span className="badge-dot"></span>Approved</span>, REJECTED:<span className="badge rej"><span className="badge-dot"></span>Rejected</span> }
  return map[s] || s
}

export default function MyAttendanceClient() {
  const today = new Date()
  const [month, setMonth] = useState(today.toISOString().slice(0,7))
  const [rows, setRows] = useState([])
  const [missing, setMissing] = useState([])
  const [allReqs, setAllReqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // { date, field, clockIn, clockOut }
  const [form, setForm] = useState({ proposedTime:'', justification:'', evidence:'' })
  const [submitting, setSubmitting] = useState(false)
  const [detail, setDetail] = useState(null)

  async function load() {
    setLoading(true)
    const [y,m] = month.split('-')
    const from = `${y}-${m}-01`, to = `${y}-${m}-31`
    const [attRes, misRes, reqRes] = await Promise.all([
      fetch(`/api/attendance?from=${from}&to=${to}`).then(r=>r.json()),
      fetch('/api/attendance/missing').then(r=>r.json()),
      fetch('/api/corrections').then(r=>r.json()),
    ])
    setRows(attRes.records || [])
    setMissing(Array.isArray(misRes) ? misRes : [])
    setAllReqs(Array.isArray(reqRes) ? reqRes : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [month])

  const pendingMap = {}
  for (const req of allReqs) {
    const key = `${req.date}__${req.fieldMissing}`
    pendingMap[key] = { status: req.status, remarks: req.hodRemarks || '' }
  }

  async function submitCorrection() {
    setSubmitting(true)
    const r = await fetch('/api/corrections', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date: modal.date, fieldMissing: modal.field, ...form }) })
    const d = await r.json()
    if (!r.ok) { alert(d.error); setSubmitting(false); return }
    setModal(null); setForm({ proposedTime:'', justification:'', evidence:'' })
    load()
    setSubmitting(false)
  }

  return (
    <div>
      <div className="page-title">My attendance</div>
      <div className="page-sub">Your clock-in/out records pulled from the HR system</div>

      {missing.length > 0 && (
        <div style={{ marginBottom:20 }}>
          {missing.slice(0,3).map(m => {
            const field = m.clockIn ? 'clock_out' : 'clock_in'
            const hasPending = m.req_status === 'PENDING'
            return (
              <div key={m.id} className="alert warn" style={{ marginBottom:8 }}>
                <svg className="alert-ico" viewBox="0 0 24 24" fill="none" stroke="var(--amber-d)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <div style={{ flex:1 }}>
                  <div className="alert-ttl">Missing {field.replace('_','-')} — {fmtDate(m.date)}</div>
                  <div className="alert-txt">{hasPending ? '⏳ Correction request pending HOD review.' : 'Submit a correction to fix this.'}</div>
                </div>
                {!hasPending && <button className="btn btn-ghost btn-sm" onClick={() => setModal({ date:m.date, field, clockIn:m.clockIn||'', clockOut:m.clockOut||'' })}>Fix →</button>}
              </div>
            )
          })}
        </div>
      )}

      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-body" style={{ display:'flex', gap:10, alignItems:'center' }}>
          <input type="month" className="input" value={month} onChange={e => setMonth(e.target.value)} style={{ width:'auto' }} />
          <button className="btn btn-ghost btn-sm" onClick={load}>Filter</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding:0 }}>
          {loading ? <div className="loading">Loading…</div> : (
            <table>
              <thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Source</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {rows.map(r => {
                  const inEntry = pendingMap[`${r.date}__clock_in`] || {}
                  const outEntry = pendingMap[`${r.date}__clock_out`] || {}
                  const fixIn = !r.clockIn ? (
                    inEntry.status === 'PENDING' ? <span style={{ fontSize:11, color:'var(--amber-d)' }}>⏳ Pending</span> :
                    inEntry.status === 'REJECTED' ? <div><span style={{ fontSize:10, color:'var(--red-d)', fontWeight:600 }}>❌ Rejected</span>{inEntry.remarks && <div style={{ fontSize:10, color:'var(--text3)' }}>{inEntry.remarks}</div>}<button className="btn btn-ghost btn-sm" onClick={() => setModal({ date:r.date, field:'clock_in', clockIn:'', clockOut:r.clockOut||'' })}>Resubmit</button></div> :
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal({ date:r.date, field:'clock_in', clockIn:'', clockOut:r.clockOut||'' })}>Fix in</button>
                  ) : null
                  const fixOut = !r.clockOut ? (
                    outEntry.status === 'PENDING' ? <span style={{ fontSize:11, color:'var(--amber-d)' }}>⏳ Pending</span> :
                    outEntry.status === 'REJECTED' ? <div><span style={{ fontSize:10, color:'var(--red-d)', fontWeight:600 }}>❌ Rejected</span>{outEntry.remarks && <div style={{ fontSize:10, color:'var(--text3)' }}>{outEntry.remarks}</div>}<button className="btn btn-ghost btn-sm" onClick={() => setModal({ date:r.date, field:'clock_out', clockIn:r.clockIn||'', clockOut:'' })}>Resubmit</button></div> :
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal({ date:r.date, field:'clock_out', clockIn:r.clockIn||'', clockOut:'' })}>Fix out</button>
                  ) : null
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight:500 }}>{fmtDate(r.date)}</td>
                      <td style={{ fontVariantNumeric:'tabular-nums' }}>{r.clockIn ? r.clockIn.slice(0,5) : <span style={{ color:'var(--red)', fontWeight:600 }}>—</span>}</td>
                      <td style={{ fontVariantNumeric:'tabular-nums' }}>{r.clockOut ? r.clockOut.slice(0,5) : <span style={{ color:'var(--red)', fontWeight:600 }}>—</span>}</td>
                      <td><span style={{ fontSize:11, color:'var(--text3)' }}>{r.source}</span></td>
                      <td>{attendanceBadge(r)}</td>
                      <td style={{ display:'flex', gap:6 }}>{fixIn}{fixOut}</td>
                    </tr>
                  )
                })}
                {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text3)', padding:20 }}>No records for this month</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Correction modal */}
      {modal && (
        <div className="overlay open" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">Submit correction</div>
              <div className="modal-sub">{fmtDate(modal.date)} · {modal.field === 'clock_in' ? 'Clock-in missing' : 'Clock-out missing'}</div>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label">Proposed time <span className="req">*</span></label>
                <input type="time" className="input" value={form.proposedTime} onChange={e => setForm(f => ({...f, proposedTime: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="label">Justification <span className="req">*</span></label>
                <textarea className="textarea" rows={4} value={form.justification} onChange={e => setForm(f => ({...f, justification: e.target.value}))} placeholder="Explain why the record is missing…" />
              </div>
              <div className="form-group">
                <label className="label">Evidence <span style={{ fontSize:11, color:'var(--text3)' }}>(optional)</span></label>
                <input type="text" className="input" value={form.evidence} onChange={e => setForm(f => ({...f, evidence: e.target.value}))} placeholder="Email ref, badge log, etc." />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitCorrection} disabled={submitting || !form.proposedTime || !form.justification}>
                {submitting ? 'Submitting…' : 'Submit for approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
