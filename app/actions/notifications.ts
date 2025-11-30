'use server'

import { createClient, createServiceRoleClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/app/auth/actions'

export type NotificationType = 'payment' | 'review' | 'order' | 'system'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  link_url: string | null
  type: NotificationType
  is_read: boolean
  created_at: string
}

/**
 * Create a notification for a user
 * Uses service role client to bypass RLS (needed for webhooks and server actions)
 * Falls back to standard client if service role is not available
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  linkUrl: string | null = null,
  type: NotificationType = 'system'
): Promise<{ success: boolean; error?: string; notification?: Notification }> {
  // Try service role client first (bypasses RLS - needed for webhooks)
  let supabase
  try {
    supabase = createServiceRoleClient()
  } catch (error) {
    // Fallback to standard client if service role key is not available
    console.warn('Service role key not available, using standard client for notification')
    supabase = await createClient()
  }

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      link_url: linkUrl,
      type,
      is_read: false,
    } as any)
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    // If standard client failed, try service role as fallback
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const serviceSupabase = createServiceRoleClient()
        const { data: retryNotification, error: retryError } = await serviceSupabase
          .from('notifications')
          .insert({
            user_id: userId,
            title,
            message,
            link_url: linkUrl,
            type,
            is_read: false,
          } as any)
          .select()
          .single()

        if (retryError) {
          return { success: false, error: retryError.message }
        }

        // Revalidate user's dashboard to show new notification
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/reviewer')
        revalidatePath('/dashboard/artist')

        return { success: true, notification: retryNotification as any }
      } catch (fallbackError) {
        return { success: false, error: error.message }
      }
    }
    return { success: false, error: error.message }
  }

  // Revalidate user's dashboard to show new notification
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/reviewer')
  revalidatePath('/dashboard/artist')

  return { success: true, notification: notification as any }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true } as any)
    .eq('id', notificationId)
    .eq('user_id', user.id) // Ensure user can only mark their own notifications as read

  if (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/reviewer')
  revalidatePath('/dashboard/artist')

  return { success: true }
}

/**
 * Get unread notifications for the current user
 */
export async function getUnreadNotifications(): Promise<Notification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  return (notifications || []) as Notification[]
}

/**
 * Get all notifications for the current user (read and unread)
 */
export async function getAllNotifications(limit: number = 50): Promise<Notification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (notifications || []) as Notification[]
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllAsRead(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true } as any)
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/reviewer')
  revalidatePath('/dashboard/artist')

  return { success: true }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id) // Ensure user can only delete their own notifications

  if (error) {
    console.error('Error deleting notification:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/reviewer')
  revalidatePath('/dashboard/artist')

  return { success: true }
}

/**
 * Send a site-wide notification to all users
 * Admin only - requires admin check
 */
export async function sendSiteWideNotification(
  title: string,
  message: string,
  linkUrl: string | null = null,
  type: NotificationType = 'system'
): Promise<{ success: boolean; error?: string; count?: number }> {
  // Check if user is admin
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    return { success: false, error: 'Unauthorized: Admin access required' }
  }

  // Get all user IDs
  const { data: allProfiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id')

  if (fetchError || !allProfiles) {
    return { success: false, error: fetchError?.message || 'Failed to fetch users' }
  }

  // Use service role client to insert notifications for all users
  const serviceSupabase = createServiceRoleClient()
  
  // Prepare notifications for batch insert
  const notifications = allProfiles.map((profile) => ({
    user_id: profile.id,
    title,
    message,
    link_url: linkUrl,
    type,
    is_read: false,
  }))

  // Insert all notifications
  const { data: insertedNotifications, error: insertError } = await serviceSupabase
    .from('notifications')
    .insert(notifications as any)
    .select()

  if (insertError) {
    console.error('Error sending site-wide notification:', insertError)
    return { success: false, error: insertError.message }
  }

  // Revalidate all dashboard paths
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/reviewer')
  revalidatePath('/dashboard/artist')
  revalidatePath('/dashboard/admin')

  return { 
    success: true, 
    count: insertedNotifications?.length || 0 
  }
}

