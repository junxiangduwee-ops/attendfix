'use client'
import { useEffect, useState } from 'react'
function fmtDate(d) { if(!d) return '—'; return new Date(d+'T00:00').toLocaleDateString('en-MY',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) }
function fmtDateTime(d) { if(!d) return '—'; return new Date(d).toLocaleString('en-MY',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) }
function statusBadge(s) {
  const map = { PENDING:<span className="badge pend pulse"><span className="badge-dot"></span>Pending</span>, APPROVED:<span className="badge ok"><span className="badge-dot"></span>Approved</span>, REJECTED:<span className="badge rej"><span className="badge-dot"></span>Rejected</span> }
  return map[s] || s
}
export default function Client() {
  const [reqs, setReqs] = useState([])
  const [detail, setDetail] = useState(null)
  useEffect(() => { fetch('/api/corrections').then(r=>r.json()).then(d => setReqs(Array.isArray(d)?d:[])) }, [])
  const sc = r => r.status==='APPROVED'?'var(--green-d)':r.status==='REJECTED'?'var(--red-d)':'var(--amber-d)'
  return (
    <div>
      <div className="page-title">My requests</div>
      <div className="page-sub">Click any row to view full details</div>
      <div className="card"><div className="card-body" style={{ padding:0 }}>
        <table><thead><tr><th>Date</th><th>Missing</th><th>Proposed</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {reqs.map(r => (
            <tr key={r.id} style={{ cursor:'pointer' }} onClick={() => setDetail(r)}>
              <td style={{ fontWeight:600 }}>{fmtDate(r.date)}</td>
              <td>{(r.fieldMissing||'').replace('_',' ')}</td>
              <td style={{ fontFamily:'monospace', fontWeight:600 }}>{r.proposedTime||'—'}</td>
              <td style={{ fontSize:12, color:'var(--text3)' }}>{fmtDateTime(r.createdAt)}</td>
              <td>{statusBadge(r.status)}</td>
              <td style={{ color:'var(--text3)', fontSize:12 }}>View →</td>
            </tr>
          ))}
          {reqs.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text3)', padding:20 }}>No requests yet.</td></tr>}
        </tbody></table>
      </div></div>
      {detail && (
        <div className="overlay open" onClick={e => e.target===e.currentTarget&&setDetail(null)}>
          <div className="modal">
            <div className="modal-head"><div className="modal-title">Correction — {fmtDate(detail.date)}</div><div className="modal-sub">{(detail.fieldMissing||'').replace('_',' ')} · {fmtDateTime(detail.createdAt)}</div></div>
            <div className="modal-body">
              {[['Status', statusBadge(detail.status)],['Date',fmtDate(detail.date)],['Missing field',(detail.fieldMissing||'').replace('_',' ')],['Proposed time',<b style={{ fontFamily:'monospace', fontSize:16, color:'var(--blue)' }}>{detail.proposedTime}</b>],['Justification',detail.justification],['Evidence',detail.evidence||'None provided']].map(([l,v]) => (
                <div key={l} style={{ display:'flex', gap:8, marginBottom:12 }}><span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:'var(--text3)', minWidth:110, paddingTop:2 }}>{l}</span><span style={{ fontSize:13 }}>{v}</span></div>
              ))}
              {detail.status !== 'PENDING' && <>
                <hr style={{ border:'none', borderTop:'1px solid var(--border)', margin:'14px 0' }} />
                {[['Decided on',fmtDateTime(detail.decidedAt)],['Remarks',<span style={{ color:sc(detail) }}>{detail.hodRemarks||(detail.status==='APPROVED'?'Approved — no remarks.':'—')}</span>]].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', gap:8, marginBottom:12 }}><span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:'var(--text3)', minWidth:110, paddingTop:2 }}>{l}</span><span style={{ fontSize:13 }}>{v}</span></div>
                ))}
              </>}
            </div>
            <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setDetail(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
