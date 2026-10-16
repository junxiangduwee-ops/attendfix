import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })
    const user = await db('users').where({ email: email.toLowerCase().trim() }).first()
    if (!user || !user.is_active) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    const session = await getSession()
    session.user = { id: user.id, name: user.name, email: user.email, role: user.role, staffId: user.staff_id, department: user.department, hodId: user.hod_id }
    await session.save()
    await db('audit_logs').insert({ actor_id: user.id, action: 'LOGIN', ip: req.headers.get('x-forwarded-for') || 'unknown' })
    const redirect = user.role === 'HR' ? '/hod/history' : '/dashboard'
    return NextResponse.json({ ok: true, role: user.role, name: user.name, redirect })
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error.' }, { status: 500 }) }
}
