'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function Sidebar() {
  const [user, setUser] = useState(null)
  const [notifs, setNotifs] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const [hodCount, setHodCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(u => {
      if (u.error) { router.push('/login'); return }
      setUser(u)
      if (['HOD','ADMIN'].includes(u.role)) {
        fetch('/api/hod/corrections/pending').then(r => r.json()).then(d => setHodCount(Array.isArray(d) ? d.length : 0))
      }
    })
  }, [])

  async function loadNotifs() {
    const r = await fetch('/api/notifications?limit=15')
    const d = await r.json()
    setNotifs(Array.isArray(d) ? d : [])
    fetch('/api/notifications/read-all', { method: 'POST' })
    setUser(u => u ? { ...u, unreadCount: 0 } : u)
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!user) return <nav className="sidebar" style={{ background:'var(--surface)' }} />

  const role = user.role
  const isHOD = ['HOD','ADMIN'].includes(role)
  const isHR = role === 'HR'
  const active = p => pathname === p || pathname.startsWith(p + '/') ? 'active' : ''

  const iconMap = { missing_record:'⚠️', request_submitted:'📋', request_approved:'✅', request_rejected:'❌', approval_needed:'⏳', team_missing_record:'👥', decision_logged:'📝' }

  return (
    <nav className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon" style={{ background:'#FFD700', padding:2 }}>
          <img src="/mr-diy-icon.png" width="30" height="30" style={{ objectFit:'contain', display:'block' }} />
        </div>
        <div>
          <div className="sb-logo-name">AttendFix</div>
          <div className="sb-logo-sub">MR DIY · HR System</div>
        </div>
      </div>

      {!isHR && (
        <div className="sb-section">
          <div className="sb-section-label">Attendance</div>
          <a href="/dashboard" className={`sb-item ${active('/dashboard')}`}>
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </a>
          <a href="/my-attendance" className={`sb-item ${active('/my-attendance')}`}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            My Attendance
            {user.unreadCount > 0 && <span className="sb-badge">{user.unreadCount}</span>}
          </a>
          <a href="/my-requests" className={`sb-item ${active('/my-requests')}`}>
            <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
            My Requests
          </a>
        </div>
      )}

      {isHOD && (
        <div className="sb-section">
          <div className="sb-section-label">HOD Panel</div>
          <a href="/hod/approvals" className={`sb-item ${active('/hod/approvals')}`}>
            <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Pending Approvals
            {hodCount > 0 && <span className="sb-badge amber">{hodCount}</span>}
          </a>
          <a href="/hod/team" className={`sb-item ${active('/hod/team')}`}>
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Team Attendance
          </a>
          <a href="/hod/history" className={`sb-item ${active('/hod/history')}`}>
            <svg viewBox="0 0 24 24"><path d="M12 2v10l4 4"/><circle cx="12" cy="12" r="10"/></svg>
            Approval History
          </a>
        </div>
      )}

      {isHR && (
        <div className="sb-section">
          <div className="sb-section-label">HR Panel</div>
          <a href="/hod/history" className={`sb-item ${active('/hod/history')}`}>
            <svg viewBox="0 0 24 24"><path d="M12 2v10l4 4"/><circle cx="12" cy="12" r="10"/></svg>
            All Corrections
          </a>
          <a href="/hr/sync" className={`sb-item ${active('/hr/sync')}`}>
            <svg viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            HR Sync
          </a>
        </div>
      )}

      <div className="sb-bottom">
        <button className="sb-logout" onClick={logout} style={{ background:'none', border:'none', cursor:'pointer', width:'100%', display:'flex', gap:8, alignItems:'center', padding:'10px 12px', color:'var(--text2)', fontSize:13 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          Sign out
        </button>
      </div>

      {/* Bell */}
      <div style={{ position:'absolute', top:12, right:12 }}>
        <button className="notif-btn" onClick={() => { setShowNotif(v => !v); if(!showNotif) loadNotifs() }}>
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
          {user.unreadCount > 0 && <span className="notif-count" style={{ display:'block' }}>{user.unreadCount > 99 ? '99+' : user.unreadCount}</span>}
        </button>
        {showNotif && (
          <div className="notif-dropdown open" style={{ position:'fixed', top:52, right:16 }}>
            <div className="notif-header">
              <span className="notif-header-title">Notifications</span>
              <span className="notif-mark-read" onClick={() => { fetch('/api/notifications/read-all',{method:'POST'}); setUser(u => ({...u,unreadCount:0})); loadNotifs() }}>Mark all read</span>
            </div>
            <div className="notif-list">
              {notifs.length === 0 ? <div className="notif-empty">🎉 All caught up!</div> : notifs.map(n => (
                <div key={n.id} className={`notif-item ${n.isRead ? '' : 'unread'}`}>
                  <div className={`notif-icon ${n.type.includes('approved') ? 'ok' : n.type.includes('rejected') || n.type.includes('missing') ? 'warn' : 'info'}`}>{iconMap[n.type] || '🔔'}</div>
                  <div className="notif-content">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-msg">{n.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
