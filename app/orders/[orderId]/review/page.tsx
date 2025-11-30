import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NavbarAuth } from '@/components/navbar-auth'
import Link from 'next/link'
import { ArrowLeft, Star, Calendar, User, PlayCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

async function getOrderWithReview(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized: User not authenticated')
  }

  // Fetch order with review data
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      artist:profiles!artist_id(full_name),
      reviewer:profiles!reviewer_id(full_name, reviewer_title),
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
    .eq('id', orderId)
    .single()

  if (error || !order) {
    throw new Error('Order not found')
  }

  const orderData = order as any

  // Security check: Only artist or reviewer can view
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
    throw new Error('Unauthorized: You do not have access to this review')
  }

  // Check if review exists
  const review = orderData.reviews && orderData.reviews.length > 0 ? orderData.reviews[0] : null
  if (!review) {
    throw new Error('Review not found for this order')
  }

  // Sign media URLs for secure access
  const signedReview = { ...review }

  // Helper function to extract file path from Supabase storage URL or storage path
  const extractFilePathFromUrl = (url: string, bucketName: string): string | null => {
    if (!url) return null
    
    // If it's already a storage path (format: bucketName/path), extract the path part
    if (url.startsWith(`${bucketName}/`) && !url.startsWith('http')) {
      return url.substring(bucketName.length + 1) // Remove "bucketName/" prefix
    }
    
    // If it's a full URL, extract the path
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      const bucketIndex = pathParts.findIndex(part => part === bucketName)
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/')
      }
      const match = url.match(new RegExp(`/${bucketName}/([^?]+)`))
      return match ? match[1] : null
    } catch (error) {
      // If URL parsing fails, try regex extraction
      const match = url.match(new RegExp(`/${bucketName}/([^?]+)`))
      return match ? match[1] : null
    }
  }

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

  return {
    order: orderData,
    review: signedReview
  }
}

export default async function ReviewResultsPage({ params }: { params: { orderId: string } }) {
  let orderData: any
  let reviewData: any

  try {
    const result = await getOrderWithReview(params.orderId)
    orderData = result.order
    reviewData = result.review
  } catch (error: any) {
    redirect('/dashboard/artist')
  }

  // Parse scorecard_16 (it's stored as JSONB)
  const scorecard = Array.isArray(reviewData.scorecard_16) 
    ? reviewData.scorecard_16 
    : (typeof reviewData.scorecard_16 === 'string' ? JSON.parse(reviewData.scorecard_16) : [])

  // Parse tags (it's stored as JSONB)
  const tags = Array.isArray(reviewData.tags) 
    ? reviewData.tags 
    : (typeof reviewData.tags === 'string' ? JSON.parse(reviewData.tags) : [])

  // Determine media type
  const hasVideo = !!reviewData.video_url
  const hasAudio = !!reviewData.audio_url
  const mediaType = hasVideo ? 'video' : hasAudio ? 'audio' : null

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <header className="border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-white">
            Amplifyd Studio
          </Link>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              asChild
              className="text-white/70 hover:text-white"
            >
              <Link href="/dashboard/artist">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <NavbarAuth isAuthenticated={true} />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 lg:p-12 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Review for {orderData.track_title || 'Untitled Track'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/70">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {reviewData.published_date 
                      ? new Date(reviewData.published_date).toLocaleDateString(undefined, { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                      : new Date(reviewData.created_at).toLocaleDateString(undefined, { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    Reviewed by {orderData.reviewer?.full_name || 'Unknown Reviewer'}
                    {reviewData.reviewer_title && ` • ${reviewData.reviewer_title}`}
                  </span>
                </div>
                <Badge className="bg-[#8B5CF6]/20 text-[#C4B5FD] border-[#8B5CF6]/40 flex items-center gap-1">
                  <Star className="h-3 w-3 text-[#FACC15]" />
                  {reviewData.overall_rating?.toFixed(1) || 'N/A'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Top Section: Video/Audio Player */}
        {mediaType && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                {reviewData.reviewer_media_title || (mediaType === 'video' ? 'Video Review' : 'Audio Review')}
              </CardTitle>
              {reviewData.reviewer_media_description && (
                <p className="text-white/70 text-sm mt-2">
                  {reviewData.reviewer_media_description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {mediaType === 'video' ? (
                <div className="rounded-lg overflow-hidden border border-white/10 bg-black/30">
                  <video 
                    controls 
                    className="w-full"
                    src={reviewData.video_url}
                  >
                    Your browser does not support the video element.
                  </video>
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                  <audio 
                    controls 
                    className="w-full"
                    src={reviewData.audio_url}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Middle Section: Scorecard Grid */}
        {scorecard && scorecard.length > 0 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl mb-8">
            <CardHeader>
              <CardTitle className="text-white">16-Point Scorecard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {scorecard.map((item: { metric: string; score: number }, index: number) => (
                  <div
                    key={index}
                    className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">{item.metric}</span>
                      <span className="text-white font-semibold">{item.score.toFixed(1)}</span>
                    </div>
                    <Progress 
                      value={(item.score / 10) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom Section: Summary, Tags, Written Feedback */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Summary */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 leading-relaxed">
                {reviewData.summary || 'No summary provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Highlights */}
          {reviewData.highlights && (
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 leading-relaxed">
                  {reviewData.highlights}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl mt-6">
            <CardHeader>
              <CardTitle className="text-white">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string, index: number) => (
                  <Badge 
                    key={index}
                    className="bg-[#8B5CF6]/20 text-[#C4B5FD] border-[#8B5CF6]/40"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Written Feedback */}
        {reviewData.written_feedback && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl mt-6">
            <CardHeader>
              <CardTitle className="text-white">Detailed Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                  {reviewData.written_feedback}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

