import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
export async function POST() {
  const user = await getUser()
  if (!user || !['HR','ADMIN'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { retryFailedPushes } = await import('@/lib/sync.js')
  const result = await retryFailedPushes()
  return NextResponse.json(result)
}
