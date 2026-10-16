import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
export async function GET(req) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from'), to = searchParams.get('to')
  const page = parseInt(searchParams.get('page') || '1'), limit = parseInt(searchParams.get('limit') || '31')
  let q = db('attendance').where({ user_id: user.id })
  if (from && to) q = q.whereBetween('date', [from, to])
  else if (from) q = q.where('date', '>=', from)
  else if (to) q = q.where('date', '<=', to)
  const [{ count }] = await q.clone().count('id as count')
  const records = await q.orderBy('date', 'desc').limit(limit).offset((page-1)*limit)
  return NextResponse.json({ records, total: parseInt(count), page })
}
