'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper function to extract file path from Supabase storage URL or storage path
function extractFilePathFromUrl(url: string, bucketName: string): string | null {
  if (!url) return null

  // Case 1: It's already a clean path (e.g. "folder/file.mp3")
  // We assume if it doesn't start with http/https, it might be a path.
  // But we need to ensure we don't double-strip the bucket name if it's not there.
  if (!url.startsWith('http')) {
    if (url.startsWith(`${bucketName}/`)) {
      return url.substring(bucketName.length + 1)
    }
    return url // Assume it's the path itself
  }

  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    
    // Find where the bucket name appears in the path
    const bucketIndex = pathParts.findIndex(part => part === bucketName)

    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      // Return everything after the bucket name
      return decodeURIComponent(pathParts.slice(bucketIndex + 1).join('/'))
    }
  } catch (e) {
    console.warn('URL parsing failed, falling back to regex', e)
  }

  // Fallback: Regex for standard Supabase URLs
  const match = url.match(new RegExp(`/${bucketName}/([^?#]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

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
        reviewer_title,
        summary,
        highlights,
        tags,
        scorecard_16,
        overall_rating,
        written_feedback,
        video_url,
        audio_url,
        reviewer_media_title,
        reviewer_media_description,
        published_date,
        created_at
      )
    `)
    .eq('artist_id', user.id)
    .order('created_at', { ascending: false })

  if (!orders) return []

  // Sign media URLs for secure access
  const ordersWithSignedUrls = await Promise.all(
    orders.map(async (order: any) => {
      if (order.reviews && Array.isArray(order.reviews)) {
        const signedReviews = await Promise.all(
          order.reviews.map(async (review: any) => {
            const signedReview = { ...review }

            // Sign video URL if exists
            if (review.video_url) {
              try {
                const filePath = extractFilePathFromUrl(review.video_url, 'reviews')
                if (filePath) {
                  const { data: signedUrl } = await supabase.storage
                    .from('reviews')
                    .createSignedUrl(filePath, 3600)
                  if (signedUrl) {
                    signedReview.video_url = signedUrl.signedUrl
                  }
                }
              } catch (error) {
                console.error('Error signing video URL:', error)
                // Keep original URL if signing fails
              }
            }

            // Sign audio URL if exists
            if (review.audio_url) {
              try {
                const filePath = extractFilePathFromUrl(review.audio_url, 'reviews')
                if (filePath) {
                  const { data: signedUrl } = await supabase.storage
                    .from('reviews')
                    .createSignedUrl(filePath, 3600)
                  if (signedUrl) {
                    signedReview.audio_url = signedUrl.signedUrl
                  }
                }
              } catch (error) {
                console.error('Error signing audio URL:', error)
                // Keep original URL if signing fails
              }
            }

            return signedReview
          })
        )
        return { ...order, reviews: signedReviews }
      }
      return order
    })
  )

  return ordersWithSignedUrls
}

export async function getReviewerOrdersWithReviews() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get orders for the reviewer with artist info and reviews
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      artist:profiles!artist_id(full_name, avatar_url),
      reviews (
        id,
        reviewer_title,
        summary,
        highlights,
        tags,
        scorecard_16,
        overall_rating,
        written_feedback,
        video_url,
        audio_url,
        reviewer_media_title,
        reviewer_media_description,
        published_date,
        created_at
      )
    `)
    .eq('reviewer_id', user.id)
    .order('created_at', { ascending: false })

  if (!orders) return []

  // Sign media URLs for secure access
  const ordersWithSignedUrls = await Promise.all(
    orders.map(async (order: any) => {
      const signedOrder = { ...order }

      // Sign track_url if exists (from submissions bucket)
      if (order.track_url) {
        try {
          const filePath = extractFilePathFromUrl(order.track_url, 'submissions')
          if (filePath) {
            const { data: signedUrl } = await supabase.storage
              .from('submissions')
              .createSignedUrl(filePath, 3600) // 1 hour expiry
            if (signedUrl) {
              signedOrder.track_url = signedUrl.signedUrl
            }
          }
        } catch (error) {
          console.error('Error signing track URL:', error)
          // Keep original URL if signing fails
        }
      }

      // Process review media URLs
      if (order.reviews && Array.isArray(order.reviews)) {
        const signedReviews = await Promise.all(
          order.reviews.map(async (review: any) => {
            const signedReview = { ...review }

            // Sign video URL if exists
            if (review.video_url) {
              try {
                const filePath = extractFilePathFromUrl(review.video_url, 'reviews')
                if (filePath) {
                  const { data: signedUrl } = await supabase.storage
                    .from('reviews')
                    .createSignedUrl(filePath, 3600)
                  if (signedUrl) {
                    signedReview.video_url = signedUrl.signedUrl
                  }
                }
              } catch (error) {
                console.error('Error signing video URL:', error)
                // Keep original URL if signing fails
              }
            }

            // Sign audio URL if exists
            if (review.audio_url) {
              try {
                const filePath = extractFilePathFromUrl(review.audio_url, 'reviews')
                if (filePath) {
                  const { data: signedUrl } = await supabase.storage
                    .from('reviews')
                    .createSignedUrl(filePath, 3600)
                  if (signedUrl) {
                    signedReview.audio_url = signedUrl.signedUrl
                  }
                }
              } catch (error) {
                console.error('Error signing audio URL:', error)
                // Keep original URL if signing fails
              }
            }

            return signedReview
          })
        )
        signedOrder.reviews = signedReviews
      }

      return signedOrder
    })
  )

  return ordersWithSignedUrls
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