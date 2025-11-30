'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface UpdateReviewerProfileData {
  full_name: string
  bio: string
  tags: string[]
  avatar_url: string | null
  pricing_packages: any[]
  reviewer_title?: string
}

/**
 * Update reviewer profile
 */
export async function updateReviewerProfile(
  data: UpdateReviewerProfileData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Validate required fields
  if (!data.full_name || !data.full_name.trim()) {
    return { success: false, error: 'Full name is required' }
  }

  if (!data.pricing_packages || data.pricing_packages.length === 0) {
    return { success: false, error: 'At least one pricing package is required' }
  }

  // Validate packages
  for (const pkg of data.pricing_packages) {
    if (!pkg.title || !pkg.title.trim() || !pkg.price || pkg.price <= 0) {
      return { success: false, error: 'All packages must have a title and valid price' }
    }
  }

  // Build update object
  const updateData: any = {
    full_name: data.full_name.trim(),
    bio: data.bio?.trim() || '',
    tags: data.tags || [],
    avatar_url: data.avatar_url?.trim() || null,
    pricing_packages: data.pricing_packages,
    updated_at: new Date().toISOString(),
  }

  // Add reviewer_title if provided
  if (data.reviewer_title !== undefined) {
    updateData.reviewer_title = data.reviewer_title.trim() || null
  }

  // Update profiles table
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    console.error('Error updating reviewer profile:', error)
    return { success: false, error: error.message }
  }

  // Revalidate paths
  revalidatePath('/marketplace')
  revalidatePath('/dashboard/reviewer')
  revalidatePath('/dashboard/reviewer/settings')

  return { success: true }
}

