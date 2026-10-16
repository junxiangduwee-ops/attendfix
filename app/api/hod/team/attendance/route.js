import { NextResponse } from 'next/server'
import { getUser } from '@/lib/session'
import { db } from '@/lib/db'
export async function GET(req) {
  const user = await getUser()
  if (!user || !['HOD','HR','ADMIN'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from'), to = searchParams.get('to')
  let q = db('attendance as a').join('users as u','u.id','a.user_id')
    .select(db.raw('u.id as id'),db.raw('a.user_id as user_id'),db.raw('a.date as date'),db.raw('a.clock_in as clock_in'),db.raw('a.clock_out as clock_out'),db.raw('a.source as source'),db.raw('u.name as name'),db.raw('u.staff_id as staff_id'))
    .where('u.is_active', true)
  if (user.role === 'HOD') q = q.where('u.hod_id', user.id)
  if (from && to) q = q.whereBetween('a.date', [from, to])
  else if (from) q = q.where('a.date', '>=', from)
  const rows = await q.orderBy('a.date', 'asc')
  return NextResponse.json(rows)
}
