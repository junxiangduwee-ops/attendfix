'use client'
import { useEffect, useState } from 'react'
function fmtDateTime(d) { if(!d) return '—'; return new Date(d).toLocaleString('en-MY',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) }
export default function Client() {
  const today = new Date(), yesterday = new Date(today); yesterday.setDate(today.getDate()-1)
  const [pullFrom, setPullFrom] = useState(today.toISOString().slice(0,10))
  const [pullTo, setPullTo] = useState('')
  const [detectFrom, setDetectFrom] = useState(yesterday.toISOString().slice(0,10))
  const [detectTo, setDetectTo] = useState(today.toISOString().slice(0,10))
  const [pullResult, setPullResult] = useState('')
  const [detectResult, setDetectResult] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')
  const [syncLog, setSyncLog] = useState([])

  async function loadLog() { fetch('/api/hr/sync-log').then(r=>r.json()).then(d=>setSyncLog(Array.isArray(d)?d:[])) }
  useEffect(() => { loadLog() }, [])

  function setQuick(type, preset) {
    const t = new Date(), y = new Date(t); y.setDate(t.getDate()-1); const w = new Date(t); w.setDate(t.getDate()-6); const m = new Date(t); m.setDate(t.getDate()-29)
    const fmt = d => d.toISOString().slice(0,10)
    const setF = type==='pull' ? setPullFrom : setDetectFrom
    const setT = type==='pull' ? setPullTo : setDetectTo
    if(preset==='yesterday'){setF(fmt(y));setT('')}
    if(preset==='week'){setF(fmt(w));setT(fmt(y))}
    if(preset==='month'){setF(fmt(m));setT(fmt(y))}
  }

  async function triggerPull() {
    setPullResult('Pulling…')
    const body = { date_from: pullFrom }; if(pullTo) body.date_to = pullTo
    const d = await fetch('/api/hr/pull',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json())
    setPullResult(`${d.status==='ok'?'✅':'❌'} ${d.records_affected} records imported`); loadLog()
  }

  async function triggerDetect() {
    setDetectResult('Detecting…')
    const body = { date_from: detectFrom }; if(detectTo) body.date_to = detectTo
    const d = await fetch('/api/hr/detect-missing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json())
    const days = d.dates ? ` across ${d.dates} day${d.dates!==1?'s':''}` : ` for ${detectFrom}`
    setDetectResult(`✅ ${d.notified||0} notifications sent${days}`); loadLog()
  }

  async function uploadFile(e) {
    const file = e.target.files[0]; if(!file) return
    setUploadStatus(`Uploading ${file.name.split('.').pop().toUpperCase()}…`)
    const form = new FormData(); form.append('file', file)
    try {
      const r = await fetch('/api/hr/import/csv',{method:'POST',body:form})
      const d = await r.json()
      if(!r.ok) throw new Error(d.error)
      setUploadStatus(`✅ ${d.imported} imported${d.skipped>0?`, ${d.skipped} skipped`:''}`)
      loadLog()
    } catch(err) { setUploadStatus('❌ '+err.message) }
    e.target.value = ''
  }

  return (
    <div>
      <div className="page-title">HR Sync</div>
      <div className="page-sub">Connect and sync attendance data from your HR system</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div className="card" style={{ marginBottom:0 }}>
          <div className="card-header"><span className="card-title">⬇ Pull from HR</span></div>
          <div className="card-body">
            <p style={{ fontSize:13, color:'var(--text2)', marginBottom:14 }}>Fetch attendance records from the HR system.</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
              <div><label className="label" style={{ fontSize:11 }}>From</label><input type="date" className="input" value={pullFrom} onChange={e=>setPullFrom(e.target.value)} style={{ width:'auto' }} /></div>
              <div><label className="label" style={{ fontSize:11 }}>To <span style={{ color:'var(--text3)' }}>(optional)</span></label><input type="date" className="input" value={pullTo} onChange={e=>setPullTo(e.target.value)} style={{ width:'auto' }} /></div>
              <div style={{ alignSelf:'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={()=>setQuick('pull','yesterday')}>Yesterday</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setQuick('pull','week')}>Last 7 days</button>
              </div>
            </div>
            <button className="btn btn-primary" onClick={triggerPull}>Pull now</button>
            {pullResult && <div style={{ marginTop:12, fontSize:13 }}>{pullResult}</div>}
          </div>
        </div>
        <div className="card" style={{ marginBottom:0 }}>
          <div className="card-header"><span className="card-title">🔍 Detect missing</span></div>
          <div className="card-body">
            <p style={{ fontSize:13, color:'var(--text2)', marginBottom:14 }}>Scan for missing clock-in/out and notify employees.</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12, alignItems:'center' }}>
              <div><label className="label" style={{ fontSize:11 }}>From</label><input type="date" className="input" value={detectFrom} onChange={e=>setDetectFrom(e.target.value)} style={{ width:'auto' }} /></div>
              <div><label className="label" style={{ fontSize:11 }}>To <span style={{ color:'var(--text3)' }}>(optional)</span></label><input type="date" className="input" value={detectTo} onChange={e=>setDetectTo(e.target.value)} style={{ width:'auto' }} /></div>
              <div style={{ alignSelf:'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={()=>setQuick('detect','yesterday')}>Yesterday</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setQuick('detect','week')}>Last 7 days</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setQuick('detect','month')}>Last 30 days</button>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={triggerDetect}>Detect now</button>
            {detectResult && <div style={{ marginTop:12, fontSize:13 }}>{detectResult}</div>}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><span className="card-title">📤 File import</span></div>
        <div className="card-body">
          <p style={{ fontSize:13, color:'var(--text2)', marginBottom:14 }}>Upload attendance data from your HR or biometric system. Supports Excel (.xlsx) and CSV.</p>
          <div style={{ border:'2px dashed var(--border2)', borderRadius:'var(--r)', padding:28, textAlign:'center', cursor:'pointer', marginBottom:12 }} onClick={() => document.getElementById('fileInput').click()}>
            <div style={{ fontSize:28, marginBottom:6 }}>📂</div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>Drop file here or click to browse</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>.xlsx or .csv · max 10 MB</div>
          </div>
          <input id="fileInput" type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={uploadFile} />
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <a href="/api/hr/import/template" className="btn btn-ghost btn-sm">⬇ Download template</a>
            {uploadStatus && <span style={{ fontSize:12, color:'var(--text3)' }}>{uploadStatus}</span>}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">📋 Sync log</span></div>
        <div className="card-body" style={{ padding:0 }}>
          <table><thead><tr><th>Time</th><th>Direction</th><th>Status</th><th>Records</th><th>Detail</th></tr></thead>
          <tbody>
            {syncLog.map(r=>(
              <tr key={r.id}>
                <td style={{ fontSize:12, color:'var(--text3)', whiteSpace:'nowrap' }}>{fmtDateTime(r.createdAt)}</td>
                <td>{r.direction}</td>
                <td><span style={{ color:r.status==='ok'?'var(--green-d)':r.status==='partial'?'var(--amber-d)':'var(--red-d)', fontWeight:600, fontSize:12 }}>{r.status}</span></td>
                <td>{r.recordsAffected}</td>
                <td style={{ fontSize:12, color:'var(--text3)' }}>{r.detail||'—'}</td>
              </tr>
            ))}
            {syncLog.length===0&&<tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text3)', padding:20 }}>No sync activity yet</td></tr>}
          </tbody></table>
        </div>
      </div>
    </div>
  )
}
