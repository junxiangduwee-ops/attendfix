import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
export async function POST(req) {
  const user = await getUser()
  if (!user || !['HR','ADMIN'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { date_from, date_to, date } = await req.json()
  const today = new Date().toISOString().slice(0,10)
  const from = date_from || date || today
  const { pullFromHR } = await import('@/lib/sync.js')
  const result = await pullFromHR(from, date_to || null)
  return NextResponse.json(result)
}
