'use client'
import { useEffect, useState } from 'react'
function fmtDate(d) { if(!d) return '—'; const dt=new Date(d+'T00:00'); return dt.toLocaleDateString('en-MY',{weekday:'short',day:'numeric',month:'short'}) }
function attendanceBadge(r) {
  const ci = r.clock_in  || r.clockIn
  const co = r.clock_out || r.clockOut
  if (!ci && !co) return <span className="badge miss"><span className="badge-dot"></span>Missing</span>
  if (!ci) return <span className="badge miss"><span className="badge-dot"></span>No in</span>
  if (!co) return <span className="badge miss"><span className="badge-dot"></span>No out</span>
  if (r.source === 'CORRECTED') return <span className="badge fill"><span className="badge-dot"></span>Corrected</span>
  return <span className="badge ok"><span className="badge-dot"></span>Complete</span>
}
export default function Client() {
  const today = new Date(), from6 = new Date(today); from6.setDate(today.getDate()-6)
  const [fromDate, setFromDate] = useState(from6.toISOString().slice(0,10))
  const [toDate, setToDate] = useState(today.toISOString().slice(0,10))
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  async function load() {
    setLoading(true)
    const rows = await fetch(`/api/hod/team/attendance?from=${fromDate}&to=${toDate}`).then(r=>r.json())
    const dates = [...new Set((Array.isArray(rows)?rows:[]).map(r=>r.date))].sort()
    const empMap = {}
    for (const r of (Array.isArray(rows)?rows:[])) {
      const uid = r.user_id
      if (!empMap[uid]) empMap[uid] = { name: r.name, staffId: r.staff_id, days:{} }
      if (r.date) empMap[uid].days[r.date] = r
    }
    setData({ dates, employees: Object.values(empMap).sort((a,b)=>a.name.localeCompare(b.name)) })
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  return (
    <div>
      <div className="page-title">Team attendance</div>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input type="date" className="input" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{ width:'auto' }} />
        <span style={{ color:'var(--text3)' }}>to</span>
        <input type="date" className="input" value={toDate} onChange={e=>setToDate(e.target.value)} style={{ width:'auto' }} />
        <button className="btn btn-ghost btn-sm" onClick={load}>Filter</button>
      </div>
      <div className="card" style={{ overflowX:'auto' }}>
        {loading ? <div className="loading">Loading…</div> : !data.dates?.length ? <div className="empty" style={{ padding:40 }}><div className="empty-icon">👥</div><div className="empty-text">No records found.</div></div> : (
          <table>
            <thead><tr><th>Employee</th>{data.dates.map(d=><th key={d} style={{ textAlign:'center', whiteSpace:'nowrap' }}>{fmtDate(d)}</th>)}</tr></thead>
            <tbody>{data.employees.map(emp=>(
              <tr key={emp.staffId}>
                <td><div style={{ fontWeight:600 }}>{emp.name}</div><div style={{ fontSize:11, color:'var(--text3)' }}>{emp.staffId}</div></td>
                {data.dates.map(d=>{
                  const rec = emp.days[d]
                  return <td key={d} style={{ textAlign:'center' }}>{rec ? <>{attendanceBadge(rec)}<div style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>{(rec.clock_in||rec.clockIn)?(rec.clock_in||rec.clockIn).slice(0,5):'?'}–{(rec.clock_out||rec.clockOut)?(rec.clock_out||rec.clockOut).slice(0,5):'?'}</div></> : <span style={{ color:'var(--text3)' }}>—</span>}</td>
                })}
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}
