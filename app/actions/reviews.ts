'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { ReviewSubmissionPayload } from '@/types/reviews'
import { createNotification } from '@/app/actions/notifications'

export async function submitReview(
  orderId: string, 
  payload: ReviewSubmissionPayload,
  requiredReviewTypes?: string[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated')
  }

  // Pro Studio Schema Validation - Enforce required fields
  if (!payload.reviewerTitle || payload.reviewerTitle.trim().length === 0) {
    throw new Error('Reviewer title is required')
  }

  if (!payload.summary || payload.summary.trim().length < 100) {
    throw new Error(`Summary is required and must be at least 100 characters (currently ${payload.summary?.length || 0} characters)`)
  }

  if (!payload.tags || !Array.isArray(payload.tags) || payload.tags.length === 0) {
    throw new Error('At least one tag is required')
  }

  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  if (!payload.scorecard || !Array.isArray(payload.scorecard) || payload.scorecard.length !== 16) {
    throw new Error(`Scorecard must have exactly 16 items (currently ${payload.scorecard?.length || 0} items)`)
  }

  // Validate each scorecard item
  for (const item of payload.scorecard) {
    if (!item.metric || typeof item.metric !== 'string') {
      throw new Error('All scorecard items must have a valid metric name')
    }
    if (typeof item.score !== 'number' || item.score < 0) {
      throw new Error('All scorecard items must have a valid numeric score')
    }
  }

  // Get order to fetch package requirements if not provided
  let reviewTypes = requiredReviewTypes
  if (!reviewTypes) {
    const { data: order } = await supabase
      .from('orders')
      .select('selected_package_id, reviewer:profiles!reviewer_id(pricing_packages)')
      .eq('id', orderId)
      .single()

    const orderData = order as any
    if (orderData?.selected_package_id && orderData.reviewer?.pricing_packages) {
      const packages = Array.isArray(orderData.reviewer.pricing_packages) 
        ? orderData.reviewer.pricing_packages 
        : []
      const selectedPackage = packages.find((pkg: any) => pkg.id === orderData.selected_package_id)
      if (selectedPackage?.reviewTypes) {
        reviewTypes = selectedPackage.reviewTypes
      }
    }
  }

  // Backend validation based on required review types
  if (reviewTypes && reviewTypes.length > 0) {
    // Validate scorecard (if required) - Now enforces 16-point scorecard
    if (reviewTypes.includes('scorecard')) {
      if (!payload.scorecard || payload.scorecard.length !== 16) {
        throw new Error('Scorecard is required for this package. Please complete all 16 criteria.')
      }
    }

    // Validate written review (if required) - 1000 character minimum
    if (reviewTypes.includes('written')) {
      if (!payload.writtenFeedback || payload.writtenFeedback.trim().length < 1000) {
        throw new Error(`Written review is required and must be at least 1000 characters (currently ${payload.writtenFeedback?.length || 0} characters)`)
      }
    }

    // Validate video review (if required) - must be MP4
    if (reviewTypes.includes('video')) {
      if (!payload.media || payload.media.type !== 'video') {
        throw new Error('Video review is required for this package. Please upload an MP4 video file.')
      }
      // Verify URL points to MP4 (basic check)
      if (!payload.media.url.match(/\.mp4/i) && !payload.media.url.includes('video/mp4')) {
        throw new Error('Video review must be in MP4 format')
      }
      if (!payload.media.title || payload.media.title.trim().length === 0) {
        throw new Error('Video review title is required')
      }
    }

    // Validate audio review (if required) - must be MP3
    if (reviewTypes.includes('audio')) {
      if (!payload.media || payload.media.type !== 'audio') {
        throw new Error('Audio review is required for this package. Please upload an MP3 audio file.')
      }
      // Verify URL points to MP3 (basic check)
      if (!payload.media.url.match(/\.mp3/i) && !payload.media.url.includes('audio/mpeg') && !payload.media.url.includes('audio/mp3')) {
        throw new Error('Audio review must be in MP3 format')
      }
      if (!payload.media.title || payload.media.title.trim().length === 0) {
        throw new Error('Audio review title is required')
      }
    }
  }
  
  // 1. Create the review record with Pro Studio schema
  const reviewData: any = {
    order_id: orderId,
    reviewer_id: user.id,
    reviewer_title: payload.reviewerTitle,
    summary: payload.summary,
    highlights: payload.highlights || null,
    tags: payload.tags,
    scorecard_16: payload.scorecard,
    overall_rating: payload.rating,
    written_feedback: payload.writtenFeedback || null,
    published_date: new Date().toISOString(),
  }

  // Add media fields if present
  if (payload.media) {
    if (payload.media.type === 'video') {
      reviewData.video_url = payload.media.url
      reviewData.reviewer_media_title = payload.media.title
      reviewData.reviewer_media_description = payload.media.description || null
    } else if (payload.media.type === 'audio') {
      reviewData.audio_url = payload.media.url
      reviewData.reviewer_media_title = payload.media.title
      reviewData.reviewer_media_description = payload.media.description || null
    }
  }

  const { error: reviewError } = await supabase
    .from('reviews')
    .insert(reviewData as any)

  if (reviewError) throw new Error(reviewError.message)

  // Get order details to fetch artist_id and track_title for notification
  const { data: orderData } = await supabase
    .from('orders')
    .select('artist_id, track_title')
    .eq('id', orderId)
    .single()

  // 2. Mark order as completed
  const { error: orderError } = await (supabase
    .from('orders')
    .update({ status: 'completed' } as any)
    .eq('id', orderId) as any)

  if (orderError) throw new Error('Failed to update order status')

  // Send notification to artist about completed review
  if (orderData?.artist_id) {
    const trackTitle = orderData.track_title || 'Untitled Track'
    await createNotification(
      orderData.artist_id,
      'Review Ready!',
      `Your feedback for ${trackTitle} is here.`,
      `/orders/${orderId}/review`,
      'review'
    ).catch((err) => {
      // Log but don't fail the review submission if notification fails
      console.error('[Review Submission] Error creating notification:', err)
    })
  }

  revalidatePath('/dashboard/reviewer')
  return { success: true }
}