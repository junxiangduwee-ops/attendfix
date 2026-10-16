'use client'
import { useEffect, useState } from 'react'

function fmtDate(d) { if(!d) return '—'; const dt = new Date(d+'T00:00'); return dt.toLocaleDateString('en-MY',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) }
function attendanceBadge(r) {
  if (!r.clockIn && !r.clockOut) return <span className="badge miss"><span className="badge-dot"></span>Missing</span>
  if (!r.clockIn) return <span className="badge miss"><span className="badge-dot"></span>No clock-in</span>
  if (!r.clockOut) return <span className="badge miss"><span className="badge-dot"></span>No clock-out</span>
  if (r.source === 'CORRECTED') return <span className="badge fill"><span className="badge-dot"></span>Corrected</span>
  return <span className="badge ok"><span className="badge-dot"></span>Complete</span>
}

export default function DashboardClient() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [missing, setMissing] = useState([])
  const [recent, setRecent] = useState([])

  useEffect(() => {
    fetch('/api/me').then(r=>r.json()).then(setUser)
    fetch('/api/stats').then(r=>r.json()).then(setStats)
    fetch('/api/attendance/missing').then(r=>r.json()).then(d => setMissing(Array.isArray(d) ? d.slice(0,3) : []))
    const today = new Date().toISOString().slice(0,10)
    const from = new Date(Date.now()-7*86400000).toISOString().slice(0,10)
    fetch(`/api/attendance?from=${from}&to=${today}&limit=5`).then(r=>r.json()).then(d => setRecent(d.records || []))
  }, [])

  return (
    <div>
      <div className="page-title">Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''} 👋</div>
      <div className="page-sub">{new Date().toLocaleDateString('en-MY',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, margin:'20px 0' }}>
        {[
          { label:'Present this month', value: stats?.present ?? '—', color:'var(--green-d)' },
          { label:'Missing records', value: stats?.missing ?? '—', color:'var(--red-d)' },
          { label:'Pending requests', value: stats?.pending ?? '—', color:'var(--amber-d)' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="card-body" style={{ textAlign:'center' }}>
              <div style={{ fontSize:32, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {missing.length > 0 && (
        <div className="alert warn" style={{ marginBottom:16 }}>
          <svg className="alert-ico" viewBox="0 0 24 24" fill="none" stroke="var(--amber-d)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div style={{ flex:1 }}>
            <div className="alert-ttl">Missing attendance records</div>
            <div className="alert-txt">{missing.map(m => `${fmtDate(m.date)} — ${m.clockIn ? 'clock-out' : 'clock-in'} missing`).join(' · ')}</div>
          </div>
          <a href="/my-attendance" className="btn btn-ghost btn-sm">Fix →</a>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">Recent attendance</span><a href="/my-attendance" style={{ fontSize:12, color:'var(--blue)' }}>View all →</a></div>
        <div className="card-body" style={{ padding:0 }}>
          <table>
            <thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight:500 }}>{fmtDate(r.date)}</td>
                  <td style={{ fontVariantNumeric:'tabular-nums' }}>{r.clockIn ? r.clockIn.slice(0,5) : <span style={{ color:'var(--red)',fontWeight:600 }}>—</span>}</td>
                  <td style={{ fontVariantNumeric:'tabular-nums' }}>{r.clockOut ? r.clockOut.slice(0,5) : <span style={{ color:'var(--red)',fontWeight:600 }}>—</span>}</td>
                  <td>{attendanceBadge(r)}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--text3)', padding:20 }}>No records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
