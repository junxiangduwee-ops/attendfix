'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); setLoading(false); return }
      router.push(d.redirect || '/dashboard')
    } catch { setError('Network error. Please try again.'); setLoading(false) }
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:400, padding:24 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <img src="/mr-diy-logo.png" alt="MR DIY" style={{ width:80, height:80, objectFit:'contain', marginBottom:12, filter:'drop-shadow(0 4px 12px rgba(0,0,0,.15))' }} />
          <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-.3px', marginBottom:4, color:'var(--text)' }}>AttendFix</div>
          <div style={{ fontSize:13, color:'var(--text3)' }}>MR DIY · HR Attendance Correction System</div>
        </div>
        <div className="card">
          <div className="card-body">
            <div style={{ background:'var(--blue-l)', border:'1px solid #C7D0FF', borderRadius:10, padding:14, marginBottom:20, fontSize:12 }}>
              <strong style={{ display:'block', color:'var(--blue-d)', marginBottom:6, fontSize:11, textTransform:'uppercase', letterSpacing:'.04em' }}>🎮 Demo accounts</strong>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, color:'var(--text2)' }}><span>Employee</span><b style={{ fontFamily:'monospace', fontSize:11, color:'var(--text)' }}>user@mrdiy.com / emp123</b></div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, color:'var(--text2)' }}><span>HOD</span><b style={{ fontFamily:'monospace', fontSize:11, color:'var(--text)' }}>hod@mrdiy.com / hod123</b></div>
              <div style={{ display:'flex', justifyContent:'space-between', color:'var(--text2)' }}><span>HR</span><b style={{ fontFamily:'monospace', fontSize:11, color:'var(--text)' }}>hr@mrdiy.com / hr123</b></div>
            </div>
            {error && <div style={{ background:'var(--red-l)', border:'1px solid #fda29b', borderRadius:8, padding:'10px 12px', fontSize:13, color:'var(--red-d)', marginBottom:14 }}>{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="label">Email address</label>
                <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@mrdiy.com" required />
              </div>
              <div className="form-group">
                <label className="label">Password</label>
                <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:4 }} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
