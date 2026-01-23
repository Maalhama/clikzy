import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types/database'

/**
 * Check if current user is an admin
 * Returns the profile if admin, throws redirect otherwise
 */
export async function requireAdmin(): Promise<Profile> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_admin) {
    redirect('/lobby')
  }

  return profile as Profile
}

/**
 * Check if current user is an admin (for API routes)
 * Returns { isAdmin: boolean, user: User | null, profile: Profile | null }
 */
export async function checkAdminStatus(): Promise<{
  isAdmin: boolean
  userId: string | null
  profile: Profile | null
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { isAdmin: false, userId: null, profile: null }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    isAdmin: profile?.is_admin === true,
    userId: user.id,
    profile: profile as Profile | null
  }
}
