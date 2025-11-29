'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(orderId: string, payload: {
  scorecard?: any
  writtenFeedback?: string
  overallRating: number
  videoUrl?: string
  audioUrl?: string
}) {
  const supabase = createClient()
  
  // 1. Create the review record
  const { error: reviewError } = await supabase
    .from('reviews')
    .insert({
      order_id: orderId,
      reviewer_id: (await supabase.auth.getUser()).data.user?.id,
      scorecard: payload.scorecard,
      written_feedback: payload.writtenFeedback,
      overall_rating: payload.overallRating,
      video_url: payload.videoUrl,
      audio_url: payload.audioUrl
    })

  if (reviewError) throw new Error(reviewError.message)

  // 2. Mark order as completed
  const { error: orderError } = await supabase
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', orderId)

  if (orderError) throw new Error('Failed to update order status')

  revalidatePath('/dashboard/reviewer')
  return { success: true }
}