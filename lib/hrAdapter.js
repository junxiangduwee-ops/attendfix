// HR Adapter — set HR_ADAPTER=mock (demo) or HR_ADAPTER=api (real HRMS)
const mode = process.env.HR_ADAPTER || 'mock'
console.log(`[HR ADAPTER] Mode: ${mode.toUpperCase()} (${mode === 'mock' ? 'demo data' : 'live HRMS'})`)

function randBetween(min, max) { return Math.floor(Math.random()*(max-min+1))+min }
function pad(n) { return String(n).padStart(2,'0') }
function randomTime(baseH, baseM, jitter=20) { const t=baseH*60+baseM+randBetween(-jitter,jitter); const h=Math.floor(t/60),m=t%60; return `${pad(h)}:${pad(m)}:00` }

const mockAdapter = {
  async fetchAttendance(date, staffIds) {
    return staffIds.map(staffId => {
      const seed = staffId.charCodeAt(staffId.length-1) + new Date(date).getDate()
      if (seed % 15 === 0) return null
      const missingOut = seed % 6 === 0
      return { staffId, date, clockIn: randomTime(8,45,20), clockOut: missingOut ? null : randomTime(17,30,30), hrRecordId: `BIO-${staffId}-${date}` }
    }).filter(Boolean)
  },
  async pushCorrection(request) { console.log(`[MOCK] Push correction: ${request.staffId} ${request.date}`); return { ok: true } },
  async syncEmployees() { return [] }
}

const apiAdapter = {
  async fetchAttendance(date, staffIds) { console.log('[API] fetchAttendance not implemented'); return [] },
  async pushCorrection(request) { console.log('[API] pushCorrection not implemented'); return { ok: false } },
  async syncEmployees() { return [] }
}

export default mode === 'api' ? apiAdapter : mockAdapter
