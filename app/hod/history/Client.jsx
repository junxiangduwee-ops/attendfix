'use client'
import { useEffect, useState } from 'react'
function fmtDate(d) { if(!d) return '—'; return new Date(d+'T00:00').toLocaleDateString('en-MY',{day:'numeric',month:'short',year:'numeric'}) }
function fmtDateTime(d) { if(!d) return '—'; return new Date(d).toLocaleString('en-MY',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) }
function statusBadge(s) {
  const map = { PENDING:<span className="badge pend"><span className="badge-dot"></span>Pending</span>, APPROVED:<span className="badge ok"><span className="badge-dot"></span>Approved</span>, REJECTED:<span className="badge rej"><span className="badge-dot"></span>Rejected</span> }
  return map[s] || s
}
export default function Client() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [detail, setDetail] = useState(null)
  const [user, setUser] = useState(null)
  async function load() {
    const p = new URLSearchParams(); if(status)p.set('status',status); if(from)p.set('from',from); if(to)p.set('to',to)
    const d = await fetch('/api/hod/corrections/all?'+p).then(r=>r.json())
    setRows(d.rows||[]); setTotal(d.total||0)
  }
  useEffect(() => { fetch('/api/me').then(r=>r.json()).then(setUser); load() }, [])
  const isHR = user && ['HR','ADMIN'].includes(user.role)
  const sc = r => r.status==='APPROVED'?'var(--green-d)':r.status==='REJECTED'?'var(--red-d)':'var(--amber-d)'
  return (
    <div>
      <div className="page-title">Approval history</div>
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-body" style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <select className="input" value={status} onChange={e=>setStatus(e.target.value)} style={{ width:140 }}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select>
          <input type="date" className="input" value={from} onChange={e=>setFrom(e.target.value)} style={{ width:150 }} />
          <input type="date" className="input" value={to} onChange={e=>setTo(e.target.value)} style={{ width:150 }} />
          <button className="btn btn-ghost btn-sm" onClick={load}>Filter</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setStatus('');setFrom('');setTo(''); }}>Clear</button>
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)' }}>{total} records</span>
        </div>
      </div>
      <div className="card"><div className="card-body" style={{ padding:0 }}>
        <table><thead><tr><th>Employee</th>{isHR&&<th>Dept</th>}<th>Date</th><th>Missing</th><th>Proposed</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id} style={{ cursor:'pointer' }} onClick={() => setDetail(r)}>
              <td><div style={{ fontWeight:600 }}>{r.employee_name||'—'}</div><div style={{ fontSize:11, color:'var(--text3)' }}>{r.staff_id}</div></td>
              {isHR&&<td style={{ fontSize:12, color:'var(--text3)' }}>{r.department||'—'}</td>}
              <td>{fmtDate(r.date)}</td>
              <td>{(r.fieldMissing||'').replace('_',' ')}</td>
              <td style={{ fontFamily:'monospace', fontWeight:600 }}>{r.proposedTime||'—'}</td>
              <td style={{ fontSize:12, color:'var(--text3)' }}>{fmtDateTime(r.createdAt)}</td>
              <td>{statusBadge(r.status)}</td>
              <td style={{ color:'var(--text3)', fontSize:12 }}>View →</td>
            </tr>
          ))}
          {rows.length===0&&<tr><td colSpan={isHR?8:7} style={{ textAlign:'center', color:'var(--text3)', padding:20 }}>No records found</td></tr>}
        </tbody></table>
      </div></div>
      {detail && (
        <div className="overlay open" onClick={e=>e.target===e.currentTarget&&setDetail(null)}>
          <div className="modal">
            <div className="modal-head"><div className="modal-title">Correction — {fmtDate(detail.date)}</div><div className="modal-sub">{detail.employee_name} · {(detail.fieldMissing||'').replace('_',' ')}</div></div>
            <div className="modal-body">
              {[['Status',statusBadge(detail.status)],['Employee',<b>{detail.employee_name} <span style={{ fontSize:11,color:'var(--text3)' }}>{detail.staff_id}</span></b>],isHR&&['Department',detail.department],['Date',fmtDate(detail.date)],['Missing',(detail.fieldMissing||'').replace('_',' ')],['Proposed',<b style={{ fontFamily:'monospace',fontSize:16,color:'var(--blue)' }}>{detail.proposedTime}</b>],['Justification',detail.justification],['Evidence',detail.evidence||'—'],['Submitted',fmtDateTime(detail.createdAt)],detail.status!=='PENDING'&&['Decided on',fmtDateTime(detail.decidedAt)],detail.status!=='PENDING'&&['Remarks',<span style={{ color:sc(detail) }}>{detail.hodRemarks||(detail.status==='APPROVED'?'Approved.':'—')}</span>]].filter(Boolean).map(([l,v])=>(
                <div key={l} style={{ display:'flex',gap:8,marginBottom:12 }}><span style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',color:'var(--text3)',minWidth:110,paddingTop:2 }}>{l}</span><span style={{ fontSize:13 }}>{v}</span></div>
              ))}
            </div>
            <div className="modal-foot"><button className="btn btn-ghost" onClick={()=>setDetail(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
