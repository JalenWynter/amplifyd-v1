'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(
  orderId: string, 
  payload: {
    scorecard?: any
    writtenFeedback?: string
    overallRating: number
    videoUrl?: string
    audioUrl?: string
  },
  requiredReviewTypes?: string[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated')
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
    // Validate scorecard (if required)
    if (reviewTypes.includes('scorecard')) {
      if (!payload.scorecard) {
        throw new Error('Scorecard is required for this package. Please complete all 5 criteria.')
      }
      const scorecardValues = [
        payload.scorecard.mixQuality,
        payload.scorecard.vocalPerformance,
        payload.scorecard.arrangement,
        payload.scorecard.soundSelection,
        payload.scorecard.commercialViability
      ]
      if (scorecardValues.some(val => val === undefined || val === null || val < 1 || val > 5)) {
        throw new Error('All 5 scorecard criteria must be completed (values between 1-5)')
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
      if (!payload.videoUrl) {
        throw new Error('Video review is required for this package. Please upload an MP4 video file.')
      }
      // Verify URL points to MP4 (basic check)
      if (!payload.videoUrl.match(/\.mp4/i) && !payload.videoUrl.includes('video/mp4')) {
        throw new Error('Video review must be in MP4 format')
      }
    }

    // Validate audio review (if required) - must be MP3
    if (reviewTypes.includes('audio')) {
      if (!payload.audioUrl) {
        throw new Error('Audio review is required for this package. Please upload an MP3 audio file.')
      }
      // Verify URL points to MP3 (basic check)
      if (!payload.audioUrl.match(/\.mp3/i) && !payload.audioUrl.includes('audio/mpeg') && !payload.audioUrl.includes('audio/mp3')) {
        throw new Error('Audio review must be in MP3 format')
      }
    }
  }
  
  // 1. Create the review record
  const { error: reviewError } = await supabase
    .from('reviews')
    .insert({
      order_id: orderId,
      reviewer_id: user.id,
      scorecard: payload.scorecard || null,
      written_feedback: payload.writtenFeedback || null,
      overall_rating: payload.overallRating,
      video_url: payload.videoUrl || null,
      audio_url: payload.audioUrl || null
    } as any)

  if (reviewError) throw new Error(reviewError.message)

  // 2. Mark order as completed
  const updateResult = await supabase
    .from('orders')
    .update({ status: 'completed' } as any)
    .eq('id', orderId)
  
  const { error: orderError } = updateResult as any

  if (orderError) throw new Error('Failed to update order status')

  revalidatePath('/dashboard/reviewer')
  return { success: true }
}