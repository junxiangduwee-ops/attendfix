'use client'
import { useEffect, useState } from 'react'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00').toLocaleDateString('en-MY', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
}

function attendanceBadge(r) {
  const ci = r.clock_in || r.clockIn
  const co = r.clock_out || r.clockOut
  const src = r.source
  if (!ci && !co) return <span className="badge miss"><span className="badge-dot"></span>Missing</span>
  if (!ci) return <span className="badge miss"><span className="badge-dot"></span>No clock-in</span>
  if (!co) return <span className="badge miss"><span className="badge-dot"></span>No clock-out</span>
  if (src === 'CORRECTED') return <span className="badge fill"><span className="badge-dot"></span>Corrected</span>
  return <span className="badge ok"><span className="badge-dot"></span>Complete</span>
}

export default function MyAttendanceClient() {
  const today = new Date()
  const [month, setMonth] = useState(today.toISOString().slice(0, 7))
  const [rows, setRows] = useState([])
  const [missing, setMissing] = useState([])
  const [allReqs, setAllReqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ proposedTime: '', justification: '', evidence: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const [y, m] = month.split('-')
    const from = `${y}-${m}-01`, to = `${y}-${m}-31`
    const [attRes, misRes, reqRes] = await Promise.all([
      fetch(`/api/attendance?from=${from}&to=${to}`).then(r => r.json()),
      fetch('/api/attendance/missing').then(r => r.json()),
      fetch('/api/corrections').then(r => r.json()),
    ])
    setRows(attRes.records || [])
    setMissing(Array.isArray(misRes) ? misRes : [])
    setAllReqs(Array.isArray(reqRes) ? reqRes : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [month])

  // Build pendingMap from allReqs — same as old HTML version
  const pendingMap = {}
  for (const req of allReqs) {
    const key = `${req.date}__${req.field_missing || req.fieldMissing}`
    pendingMap[key] = { status: req.status, remarks: req.hod_remarks || req.hodRemarks || '' }
  }

  function openCorrection(date, clockIn, clockOut, field) {
    setModal({ date, clockIn, clockOut, field })
    setForm({ proposedTime: '', justification: '', evidence: '' })
    setErrors({})
  }

  async function submitCorrection() {
    const errs = {}
    if (!form.justification.trim()) errs.justification = true
    if (!form.proposedTime) errs.proposedTime = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      const r = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: modal.date, fieldMissing: modal.field, proposedTime: form.proposedTime, justification: form.justification, evidence: form.evidence })
      })
      const d = await r.json()
      if (!r.ok) { alert(d.error); setSubmitting(false); return }
      setModal(null)
      alert('✅ Correction request submitted! Your HOD has been notified.')
      load()
    } catch (e) { alert('Error: ' + e.message) }
    setSubmitting(false)
  }

  return (
    <div>
      <div className="page-title">My attendance</div>
      <div className="page-sub">View records and submit corrections</div>

      {/* Missing section — only show if has missing records, same as old version */}
      {missing.length > 0 && (
        <div id="missingSection">
          {missing.map(m => {
            const field = m.clock_in ? 'clock_out' : 'clock_in'
            const hasPending = m.req_status === 'PENDING'
            return (
              <div key={m.id} className="alert warn">
                <svg className="alert-ico" viewBox="0 0 24 24" fill="none" stroke="var(--amber-d)" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div style={{ flex: 1 }}>
                  <div className="alert-ttl">Missing {field.replace('_', ' ')} — {fmtDate(m.date)}</div>
                  <div className="alert-txt">{hasPending ? '⏳ Correction request pending HOD review.' : 'Submit a correction to fix this.'}</div>
                </div>
                {!hasPending && (
                  <button className="btn btn-ghost btn-sm" onClick={() => openCorrection(m.date, m.clock_in || '', m.clock_out || '', field)}>Fix →</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Attendance log card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Attendance log</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="month" className="input" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 'auto' }} />
            <button className="btn btn-ghost btn-sm" onClick={load}>Load</button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div className="loading">Loading…</div> : rows.length === 0 ? (
            <div className="empty"><div className="empty-icon">📅</div><div className="empty-text">No records for this month.</div></div>
          ) : (
            <table>
              <thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Source</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {rows.map(r => {
                  const ci = r.clock_in || r.clockIn
                  const co = r.clock_out || r.clockOut
                  const inEntry  = pendingMap[`${r.date}__clock_in`]  || {}
                  const outEntry = pendingMap[`${r.date}__clock_out`] || {}

                  const fixInBtn = !ci ? (
                    inEntry.status === 'PENDING'  ? <span style={{ fontSize:11, color:'var(--amber-d)' }}>⏳ Pending</span> :
                    inEntry.status === 'APPROVED' ? null :
                    inEntry.status === 'REJECTED' ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                        <span style={{ fontSize:10, color:'var(--red-d)', fontWeight:600 }}>❌ Rejected</span>
                        {inEntry.remarks && <span style={{ fontSize:10, color:'var(--text3)', maxWidth:140, whiteSpace:'normal' }}>{inEntry.remarks}</span>}
                        <button className="btn btn-ghost btn-sm" onClick={() => openCorrection(r.date, '', co || '', 'clock_in')}>Resubmit</button>
                      </div>
                    ) : <button className="btn btn-ghost btn-sm" onClick={() => openCorrection(r.date, '', co || '', 'clock_in')}>Fix in</button>
                  ) : null

                  const fixOutBtn = !co ? (
                    outEntry.status === 'PENDING'  ? <span style={{ fontSize:11, color:'var(--amber-d)' }}>⏳ Pending</span> :
                    outEntry.status === 'APPROVED' ? null :
                    outEntry.status === 'REJECTED' ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                        <span style={{ fontSize:10, color:'var(--red-d)', fontWeight:600 }}>❌ Rejected</span>
                        {outEntry.remarks && <span style={{ fontSize:10, color:'var(--text3)', maxWidth:140, whiteSpace:'normal' }}>{outEntry.remarks}</span>}
                        <button className="btn btn-ghost btn-sm" onClick={() => openCorrection(r.date, ci || '', '', 'clock_out')}>Resubmit</button>
                      </div>
                    ) : <button className="btn btn-ghost btn-sm" onClick={() => openCorrection(r.date, ci || '', '', 'clock_out')}>Fix out</button>
                  ) : null

                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{fmtDate(r.date)}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{ci ? ci.slice(0,5) : <span style={{ color:'var(--red)', fontWeight:600 }}>—</span>}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{co ? co.slice(0,5) : <span style={{ color:'var(--red)', fontWeight:600 }}>—</span>}</td>
                      <td><span style={{ fontSize:11, color:'var(--text3)' }}>{r.source || 'HR_SYSTEM'}</span></td>
                      <td>{attendanceBadge(r)}</td>
                      <td style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{fixInBtn}{fixOutBtn}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Correction modal — exact same layout as old HTML version */}
      {modal && (
        <div className="overlay open" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">Submit correction request</div>
              <div className="modal-sub">{fmtDate(modal.date)} · {modal.field === 'clock_in' ? 'Clock-in missing' : 'Clock-out missing'}</div>
            </div>
            <div className="modal-body">
              {/* Time boxes */}
              <div className="time-boxes">
                <div className={`time-box ${modal.clockIn ? 'recorded' : 'miss'}`}>
                  <div className="time-box-lbl">Clock in</div>
                  <div className="time-box-val">{modal.clockIn || '—'}</div>
                  <div className="time-box-note">{modal.clockIn ? 'Recorded' : 'Missing'}</div>
                </div>
                <div className={`time-box ${modal.clockOut ? 'recorded' : 'miss'}`}>
                  <div className="time-box-lbl">Clock out</div>
                  <div className="time-box-val">{modal.clockOut || '—'}</div>
                  <div className="time-box-note">{modal.clockOut ? 'Recorded' : 'Missing'}</div>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Why did you not clock {modal.field === 'clock_in' ? 'in' : 'out'}? <span className="req">*</span></label>
                <textarea className={`textarea ${errors.justification ? 'err' : ''}`} rows={3} value={form.justification} onChange={e => setForm(f => ({ ...f, justification: e.target.value }))} placeholder="Describe what happened…" />
                {errors.justification && <div className="field-err show">Please provide a justification.</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Actual time <span className="req">*</span></label>
                  <input type="time" className={`input ${errors.proposedTime ? 'err' : ''}`} value={form.proposedTime} onChange={e => setForm(f => ({ ...f, proposedTime: e.target.value }))} />
                  {errors.proposedTime && <div className="field-err show">Please enter the actual time.</div>}
                </div>
                <div className="form-group">
                  <label className="label">Supporting evidence</label>
                  <input type="text" className="input" value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))} placeholder="Email ref, manager name…" />
                  <div className="hint">Optional but helps HOD verify</div>
                </div>
              </div>

              <div className="alert info" style={{ margin: 0 }}>
                <svg className="alert-ico" viewBox="0 0 24 24" fill="none" stroke="var(--blue-d)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                <div className="alert-txt">Your HOD will be notified by email and in-app to review this request. You'll be notified of the decision.</div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitCorrection} disabled={submitting}>
                <svg viewBox="0 0 24 24" style={{ width:14, height:14, stroke:'currentColor', fill:'none', strokeWidth:2.2 }}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                {submitting ? 'Submitting…' : 'Send to HOD for approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
