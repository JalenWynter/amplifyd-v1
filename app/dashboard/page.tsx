import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardRouter() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  type UserRole = 'artist' | 'reviewer' | 'admin' | 'user'
  const role: UserRole = ((profile as any)?.role as UserRole) || 'artist'

  if (role === 'admin') redirect('/dashboard/admin')
  if (role === 'reviewer') redirect('/dashboard/reviewer')
  redirect('/dashboard/artist')
}
