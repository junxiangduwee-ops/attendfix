'use client'
import { useEffect, useState } from 'react'
function fmtDate(d) { if(!d) return '—'; return new Date(d+'T00:00').toLocaleDateString('en-MY',{weekday:'short',day:'numeric',month:'short'}) }
function timeAgo(d) { if(!d) return ''; const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<60) return 'just now'; if(s<3600) return `${Math.floor(s/60)}m ago`; if(s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago` }

export default function Client() {
  const [reqs, setReqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(null)
  const [remarks, setRemarks] = useState('')

  async function load() {
    setLoading(true)
    const d = await fetch('/api/hod/corrections/pending').then(r=>r.json())
    setReqs(Array.isArray(d)?d:[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function approve(id) {
    if (!confirm('Approve this correction?')) return
    await fetch(`/api/hod/corrections/${id}/approve`, { method:'POST' })
    load()
  }

  async function reject() {
    if (!remarks.trim()) { alert('Please provide a reason.'); return }
    await fetch(`/api/hod/corrections/${rejectModal.id}/reject`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ hodRemarks: remarks }) })
    setRejectModal(null); setRemarks(''); load()
  }

  return (
    <div>
      <div className="page-title">Pending approvals</div>
      <div className="page-sub">Review your team's correction requests</div>
      {loading ? <div className="loading">Loading…</div> : reqs.length === 0 ? (
        <div className="alert success"><div><div className="alert-ttl">All clear!</div><div className="alert-txt">No pending requests.</div></div></div>
      ) : reqs.map(r => (
        <div key={r.id} style={{ background:'var(--surface)', border:'2px solid var(--amber)', borderRadius:'var(--r)', boxShadow:'var(--sh-lg)', marginBottom:20, overflow:'hidden' }}>
          <div style={{ background:'var(--amber-l)', padding:'13px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #FEC84B' }}>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--amber-d)' }}>⏳ Correction request</span>
            <span className="badge pend pulse"><span className="badge-dot"></span>New</span>
          </div>
          <div style={{ padding:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--blue-l)', color:'var(--blue-d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700 }}>{(r.employee_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
              <div><div style={{ fontSize:14, fontWeight:700 }}>{r.employee_name}</div><div style={{ fontSize:12, color:'var(--text3)' }}>{r.department} · {r.staff_id}</div></div>
              <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text3)' }}>{timeAgo(r.createdAt)}</span>
            </div>
            <div className="info-grid">
              <div><div className="info-lbl">Date</div><div className="info-val">{fmtDate(r.date)}</div></div>
              <div><div className="info-lbl">Missing</div><div className="info-val">{(r.fieldMissing||'').replace(/_/g,' ')}</div></div>
              <div><div className="info-lbl">Proposed</div><div className="info-val" style={{ fontFamily:'monospace', fontSize:16, color:'var(--blue-d)' }}>{r.proposedTime}</div></div>
              <div><div className="info-lbl">Evidence</div><div className="info-val">{r.evidence||'None'}</div></div>
            </div>
            <div style={{ background:'var(--amber-l)', border:'1px solid #FEC84B', borderRadius:'var(--r-sm)', padding:12, marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--amber-d)', marginBottom:5, textTransform:'uppercase' }}>Justification</div>
              <div style={{ fontSize:13, lineHeight:1.7 }}>{r.justification}</div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-success" onClick={() => approve(r.id)}>✓ Approve & auto-fill</button>
              <button className="btn btn-danger" onClick={() => setRejectModal(r)}>✕ Reject</button>
            </div>
          </div>
        </div>
      ))}

      {rejectModal && (
        <div className="overlay open" onClick={e => e.target===e.currentTarget&&setRejectModal(null)}>
          <div className="modal">
            <div className="modal-head"><div className="modal-title">Reject correction</div><div className="modal-sub">{rejectModal.employee_name} · {fmtDate(rejectModal.date)}</div></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label">Reason <span className="req">*</span></label>
                <textarea className="textarea" rows={4} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Explain why. Employee will see this and may resubmit." />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={reject}>Confirm rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
