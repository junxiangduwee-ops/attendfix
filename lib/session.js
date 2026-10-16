import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: 'attendfix_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession(cookieStore, sessionOptions)
}

export async function getUser() {
  const session = await getSession()
  return session.user ?? null
}
