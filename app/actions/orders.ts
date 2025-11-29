'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createOrder(data: {
  reviewerId: string
  packageId: string
  trackUrl: string
  trackTitle: string
  priceTotal: number
  guestEmail?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      artist_id: user?.id || null, // Null if guest
      guest_email: data.guestEmail,
      reviewer_id: data.reviewerId,
      track_url: data.trackUrl,
      track_title: data.trackTitle,
      selected_package_id: data.packageId,
      price_total: data.priceTotal,
      platform_fee: Math.floor(data.priceTotal * 0.1), // 10% fee
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw new Error(`Order failed: ${error.message}`)
  
  revalidatePath('/dashboard/artist')
  return order
}

export async function getOrders() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fetch the user's role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (!profile) return []

  // Conditional fetch based on role
  const query = supabase.from('orders').select(`
    *,
    reviewer:profiles!reviewer_id(full_name, avatar_url),
    artist:profiles!artist_id(full_name, avatar_url)
  `)

  if (profile.role === 'artist') {
    query.eq('artist_id', user.id)
  } else if (profile.role === 'reviewer') {
    query.eq('reviewer_id', user.id)
  } else if (profile.role === 'admin') {
    // Admins see everything; no filter
  }

  const { data: orders } = await query.order('created_at', { ascending: false })
  return orders || []
}