'use server'

import { createClient } from '@/utils/supabase/server'

export interface UserProfile {
  id: string
  email: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

/**
 * Check if the current user is an admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile as UserProfile | null
}

/**
 * Get all user profiles (admin only)
 */
export async function getAllUserProfiles(): Promise<UserProfile[]> {
  const isAdmin = await checkIsAdmin()
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const supabase = await createClient()
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`)
  }

  return (profiles || []) as UserProfile[]
}

/**
 * Update a user's role (admin only)
 */
export async function updateUserRole(userId: string, newRole: 'user' | 'admin'): Promise<void> {
  const isAdmin = await checkIsAdmin()
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`)
  }
}

