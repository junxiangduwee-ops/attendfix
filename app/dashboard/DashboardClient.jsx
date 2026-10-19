'use client'
import { useEffect, useState } from 'react'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00').toLocaleDateString('en-MY', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
}
function attendanceBadge(r) {
  const ci = r.clock_in || r.clockIn
  const co = r.clock_out || r.clockOut
  if (!ci && !co) return <span className="badge miss"><span className="badge-dot"></span>Missing</span>
  if (!ci) return <span className="badge miss"><span className="badge-dot"></span>No clock-in</span>
  if (!co) return <span className="badge miss"><span className="badge-dot"></span>No clock-out</span>
  if (r.source === 'CORRECTED') return <span className="badge fill"><span className="badge-dot"></span>Corrected</span>
  return <span className="badge ok"><span className="badge-dot"></span>Complete</span>
}

function EmployeeDashboard({ user }) {
  const [stats, setStats]   = useState(null)
  const [missing, setMissing] = useState([])
  const [recent, setRecent] = useState([])

  useEffect(() => {
    fetch('/api/stats').then(r=>r.json()).then(setStats)
    fetch('/api/attendance/missing').then(r=>r.json()).then(d => setMissing(Array.isArray(d)?d.slice(0,3):[]))
    const today = new Date().toISOString().slice(0,10)
    const from  = new Date(Date.now()-7*86400000).toISOString().slice(0,10)
    fetch(`/api/attendance?from=${from}&to=${today}&limit=10`).then(r=>r.json()).then(d => setRecent(d.records||[]))
  }, [])

  return (
    <div>
      <div className="page-title">Welcome, {user?.name} 👋</div>
      <div className="page-sub" style={{ marginBottom:20 }}>
        {new Date().toLocaleDateString('en-MY',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
      </div>

      {missing.length > 0 && (
        <div className="alert warn" style={{ marginBottom:16 }}>
          <svg className="alert-ico" viewBox="0 0 24 24" fill="none" stroke="var(--amber-d)" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div style={{ flex:1 }}>
            <div className="alert-ttl">{missing.length} missing attendance record{missing.length>1?'s':''}</div>
            <div className="alert-txt">{missing.map(m => `${fmtDate(m.date)} — ${m.clock_in?'clock-out':'clock-in'} missing`).join(' · ')}</div>
          </div>
          <a href="/my-attendance" className="btn btn-ghost btn-sm">Fix →</a>
        </div>
      )}

      <div className="stats">
        <div className="stat"><div className="stat-val" style={{ color:'var(--green)' }}>{stats?.present ?? '—'}</div><div className="stat-label">Present this month</div></div>
        <div className="stat"><div className="stat-val" style={{ color:'var(--red)' }}>{stats?.missing ?? '—'}</div><div className="stat-label">Missing records</div></div>
        <div className="stat"><div className="stat-val" style={{ color:'var(--amber)' }}>{stats?.pending ?? '—'}</div><div className="stat-label">Pending requests</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent attendance</span>
          <a href="/my-attendance" style={{ fontSize:12, color:'var(--blue)' }}>View all →</a>
        </div>
        <div className="card-body" style={{ padding:0 }}>
          {recent.length === 0 ? (
            <div className="empty"><div className="empty-icon">📅</div><div className="empty-text">No records imported yet.<br/>HR sync runs nightly — or trigger it manually from the HR Sync page.</div></div>
          ) : (
            <table>
              <thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Source</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight:500 }}>{fmtDate(r.date)}</td>
                    <td style={{ fontVariantNumeric:'tabular-nums' }}>{(r.clock_in||r.clockIn) ? (r.clock_in||r.clockIn).slice(0,5) : <span style={{ color:'var(--red)' }}>—</span>}</td>
                    <td style={{ fontVariantNumeric:'tabular-nums' }}>{(r.clock_out||r.clockOut) ? (r.clock_out||r.clockOut).slice(0,5) : <span style={{ color:'var(--red)' }}>—</span>}</td>
                    <td><span style={{ fontSize:11, color:'var(--text3)' }}>{r.source}</span></td>
                    <td>{attendanceBadge(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function HODDashboard({ user }) {
  const [stats, setStats]     = useState(null)
  const [pending, setPending] = useState([])

  useEffect(() => {
    fetch('/api/hod/stats').then(r=>r.json()).then(setStats)
    fetch('/api/hod/corrections/pending').then(r=>r.json()).then(d => setPending(Array.isArray(d)?d:[]))
  }, [])

  return (
    <div>
      <div className="page-title">Welcome, {user?.name} 👋</div>
      <div className="page-sub" style={{ marginBottom:20 }}>{user?.role} · {user?.department}</div>

      {pending.length > 0 && (
        <div className="alert warn">
          <svg className="alert-ico" viewBox="0 0 24 24" fill="none" stroke="var(--amber-d)" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <div style={{ flex:1 }}>
            <div className="alert-ttl">{pending.length} correction request{pending.length>1?'s':''} awaiting your approval</div>
          </div>
          <a href="/hod/approvals" className="btn btn-ghost btn-sm">Review →</a>
        </div>
      )}

      {stats?.hrPendingSync > 0 && (
        <div className="alert info" style={{ marginBottom:16 }}>
          <svg className="alert-ico" viewBox="0 0 24 24" fill="none" stroke="var(--blue-d)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          <div style={{ flex:1 }}>
            <div className="alert-ttl">{stats.hrPendingSync} approved correction{stats.hrPendingSync>1?'s':''} pending HR write-back</div>
            <div className="alert-txt">These will be retried automatically every 2 hours.</div>
          </div>
          <a href="/hr/sync" className="btn btn-ghost btn-sm">View sync log →</a>
        </div>
      )}

      <div className="stats">
        <div className="stat"><div className="stat-val" style={{ color:'var(--amber)' }}>{stats?.pending ?? '—'}</div><div className="stat-label">Pending approvals</div></div>
        <div className="stat"><div className="stat-val">{stats?.teamSize ?? '—'}</div><div className="stat-label">Team members</div></div>
        <div className="stat"><div className="stat-val" style={{ color:'var(--red)' }}>{stats?.missingCount ?? '—'}</div><div className="stat-label">Team missing records</div></div>
        <div className="stat"><div className="stat-val" style={{ color: stats?.hrPendingSync > 0 ? 'var(--amber)' : 'var(--green)' }}>{stats?.hrPendingSync ?? '—'}</div><div className="stat-label">Awaiting HR write-back</div></div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Quick actions</span></div>
        <div className="card-body" style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <a href="/hod/approvals" className="btn btn-primary">Review approvals</a>
          <a href="/hod/team" className="btn btn-ghost">Team attendance</a>
          <a href="/hr/sync" className="btn btn-ghost">HR sync</a>
        </div>
      </div>
    </div>
  )
}

export default function DashboardClient() {
  const [user, setUser] = useState(null)
  useEffect(() => { fetch('/api/me').then(r=>r.json()).then(u => { if (!u.error) setUser(u) }) }, [])
  if (!user) return <div className="loading">Loading…</div>
  return ['HOD','ADMIN'].includes(user.role) ? <HODDashboard user={user} /> : <EmployeeDashboard user={user} />
}
