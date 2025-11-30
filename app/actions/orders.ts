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
  note?: string
}) {
  const supabase = await createClient()
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
      status: 'pending',
      note: data.note || null
    } as any)
    .select()
    .single()

  if (error) throw new Error(`Order failed: ${error.message}`)
  
  revalidatePath('/dashboard/artist')
  return order
}

export async function getOrders() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fetch the user's role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (!profile) return []

  const profileData = profile as any

  // Conditional fetch based on role
  const query = supabase.from('orders').select(`
    *,
    reviewer:profiles!reviewer_id(full_name, avatar_url),
    artist:profiles!artist_id(full_name, avatar_url)
  `)

  if (profileData?.role === 'artist') {
    query.eq('artist_id', user.id)
  } else if (profileData?.role === 'reviewer') {
    query.eq('reviewer_id', user.id)
  } else if (profileData?.role === 'admin') {
    // Admins see everything; no filter
  }

  const { data: orders } = await query.order('created_at', { ascending: false })
  return orders || []
}

export async function getArtistOrdersWithReviews() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get orders for the artist with reviewer info and reviews
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      reviewer:profiles!reviewer_id(full_name, avatar_url),
      reviews (
        id,
        overall_rating,
        written_feedback,
        scorecard,
        video_url,
        audio_url,
        created_at
      )
    `)
    .eq('artist_id', user.id)
    .order('created_at', { ascending: false })

  return orders || []
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated')
  }

  // Fetch order with joined profile data
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      artist:profiles!artist_id(full_name),
      reviewer:profiles!reviewer_id(full_name, pricing_packages)
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    throw new Error('Order not found')
  }

  const orderData = order as any

  // Security check: Ensure current user is either the reviewer (to write review) OR the artist (to read review)
  const isReviewer = orderData.reviewer_id === user.id
  const isArtist = orderData.artist_id === user.id

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profileData = profile as any
  const isAdmin = profileData?.role === 'admin'

  if (!isReviewer && !isArtist && !isAdmin) {
    throw new Error('Unauthorized: You do not have access to this order')
  }

  // Get the selected package's review types if package ID exists
  let requiredReviewTypes: string[] = []
  if (orderData.selected_package_id && orderData.reviewer?.pricing_packages) {
    const packages = Array.isArray(orderData.reviewer.pricing_packages) 
      ? orderData.reviewer.pricing_packages 
      : []
    const selectedPackage = packages.find((pkg: any) => pkg.id === orderData.selected_package_id)
    if (selectedPackage?.reviewTypes) {
      requiredReviewTypes = selectedPackage.reviewTypes
    }
  }

  return {
    ...orderData,
    requiredReviewTypes
  }
}