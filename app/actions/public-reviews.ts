'use server'

import { createClient } from '@/utils/supabase/server'
import { PublishedReview } from '@/types/reviews'

// Helper function to extract file path from Supabase storage URL
function extractFilePathFromUrl(url: string, bucketName: string): string | null {
  if (!url) return null
  
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    
    // Find the bucket name in the path
    const bucketIndex = pathParts.findIndex(part => part === bucketName)
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      // Get everything after the bucket name
      return pathParts.slice(bucketIndex + 1).join('/')
    }
    
    // Fallback: try to extract from common patterns
    const match = url.match(new RegExp(`/${bucketName}/(.+)`))
    if (match && match[1]) {
      // Remove query parameters if present
      return match[1].split('?')[0]
    }
    
    return null
  } catch (error) {
    // If URL parsing fails, try regex extraction
    const match = url.match(new RegExp(`/${bucketName}/([^?]+)`))
    return match ? match[1] : null
  }
}

/**
 * Get public reviews for the reviews feed
 * No authentication required - public read
 */
export async function getPublicReviews(limit: number = 12): Promise<PublishedReview[]> {
  const supabase = await createClient()

  // Query reviews with all necessary joins
  // First, get all reviews with published_date
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(`
      id,
      reviewer_title,
      summary,
      highlights,
      tags,
      scorecard_16,
      overall_rating,
      video_url,
      audio_url,
      reviewer_media_title,
      reviewer_media_description,
      published_date,
      created_at,
      order_id,
      reviewer_id,
      order:orders!inner(
        id,
        status,
        track_title,
        track_url,
        artist_id,
        artist:profiles!artist_id(
          full_name
        )
      ),
      reviewer:profiles!reviewer_id(
        full_name,
        avatar_url,
        reviewer_title
      )
    `)
    .not('published_date', 'is', null)
    .order('published_date', { ascending: false })
    .limit(limit * 2) // Get more to filter after

  if (error) {
    console.error('Error fetching public reviews:', error)
    return []
  }

  if (!reviews || reviews.length === 0) {
    return []
  }

  // Filter for completed orders only
  const completedReviews = reviews.filter((review: any) => 
    review.order && review.order.status === 'completed'
  ).slice(0, limit) // Limit to requested amount

  if (error) {
    console.error('Error fetching public reviews:', error)
    return []
  }

  if (!reviews || reviews.length === 0) {
    return []
  }

  // Transform and generate signed URLs
  const transformedReviews = await Promise.all(
    completedReviews.map(async (review: any) => {
      const orderData = review.order
      const reviewerData = review.reviewer
      const artistData = orderData?.artist

      // Parse scorecard (handle both array and JSON string)
      const scorecard = Array.isArray(review.scorecard_16)
        ? review.scorecard_16
        : (typeof review.scorecard_16 === 'string' 
            ? JSON.parse(review.scorecard_16) 
            : [])

      // Parse tags (handle both array and JSON string)
      const tags = Array.isArray(review.tags)
        ? review.tags
        : (typeof review.tags === 'string' 
            ? JSON.parse(review.tags) 
            : [])

      // Generate signed URLs for media files
      let signedVideoUrl = review.video_url
      let signedAudioUrl = review.audio_url

      if (review.video_url) {
        const filePath = extractFilePathFromUrl(review.video_url, 'reviews') || 
                        extractFilePathFromUrl(review.video_url, 'submissions')
        if (filePath) {
          const { data, error: signedUrlError } = await supabase.storage
            .from('reviews')
            .createSignedUrl(filePath, 3600) // 1 hour expiry
          
          if (!signedUrlError && data) {
            signedVideoUrl = data.signedUrl
          } else {
            console.error(`Error creating signed URL for video ${filePath}:`, signedUrlError?.message)
          }
        }
      }

      if (review.audio_url) {
        const filePath = extractFilePathFromUrl(review.audio_url, 'reviews') || 
                        extractFilePathFromUrl(review.audio_url, 'submissions')
        if (filePath) {
          const { data, error: signedUrlError } = await supabase.storage
            .from('reviews')
            .createSignedUrl(filePath, 3600) // 1 hour expiry
          
          if (!signedUrlError && data) {
            signedAudioUrl = data.signedUrl
          } else {
            console.error(`Error creating signed URL for audio ${filePath}:`, signedUrlError?.message)
          }
        }
      }

      // Build reviewerMedia object if media exists
      let reviewerMedia: PublishedReview['reviewerMedia'] | undefined
      if (signedVideoUrl && review.reviewer_media_title) {
        reviewerMedia = {
          type: 'video',
          url: signedVideoUrl,
          title: review.reviewer_media_title,
          description: review.reviewer_media_description || undefined,
        }
      } else if (signedAudioUrl && review.reviewer_media_title) {
        reviewerMedia = {
          type: 'audio',
          url: signedAudioUrl,
          title: review.reviewer_media_title,
          description: review.reviewer_media_description || undefined,
        }
      }

      // Transform to PublishedReview format
      const publishedReview: PublishedReview = {
        id: review.id,
        reviewer: reviewerData?.full_name || 'Unknown Reviewer',
        reviewerTitle: review.reviewer_title || reviewerData?.reviewer_title || '',
        artist: artistData?.full_name || 'Unknown Artist',
        trackTitle: orderData?.track_title || 'Untitled Track',
        audioUrl: orderData?.track_url || '', // Original track URL (not the review media)
        summary: review.summary || '',
        highlight: review.highlights || '', // Map highlights to highlight
        rating: review.overall_rating || 0,
        postedOn: review.published_date || review.created_at,
        tags: tags,
        scorecard: scorecard,
        reviewerMedia: reviewerMedia,
      }

      return publishedReview
    })
  )

  return transformedReviews
}

