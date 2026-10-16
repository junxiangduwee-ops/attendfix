import { redirect } from 'next/navigation'
import { getUser } from '@/lib/session'
export default async function Home() {
  const user = await getUser()
  if (!user) redirect('/login')
  if (user.role === 'HR') redirect('/hod/history')
  redirect('/dashboard')
}
