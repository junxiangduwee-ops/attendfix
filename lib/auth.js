import { getUser } from './session'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

export async function requireRole(...roles) {
  const user = await requireAuth()
  if (!roles.includes(user.role)) redirect('/dashboard')
  return user
}

export const HOD_ROLES = ['HOD', 'ADMIN']
export const HR_ROLES  = ['HR', 'ADMIN']
export const ALL_ROLES = ['EMPLOYEE', 'HOD', 'HR', 'ADMIN']
