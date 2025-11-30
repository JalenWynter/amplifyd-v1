'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getOrderById } from '@/app/actions/orders'
import { submitReview } from '@/app/actions/reviews'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/ui/star-rating'
import { NavbarAuth } from '@/components/navbar-auth'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Music, ArrowLeft, AlertCircle, Upload, FileText, X, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ScorecardGrid, SCORECARD_METRICS } from '@/components/reviews/scorecard-grid'
import { TagInput } from '@/components/reviews/tag-input'
import { ReviewSubmissionPayload } from '@/types/reviews'

type Order = {
  id: string
  track_title: string
  track_url: string
  note?: string | null
  status: string
  artist_id: string | null
  reviewer_id: string
  selected_package_id?: string | null
  artist?: { full_name: string | null }
  reviewer?: { full_name: string | null; pricing_packages?: any[] }
  requiredReviewTypes?: string[]
}

export default function ReviewSubmitPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // Form state - Pro Studio Schema
  const [reviewerTitle, setReviewerTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [highlights, setHighlights] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [scorecard, setScorecard] = useState<{ metric: string; score: number }[]>(
    SCORECARD_METRICS.map(metric => ({ metric, score: 5 }))
  )
  const [writtenFeedback, setWrittenFeedback] = useState('')
  const [overallRating, setOverallRating] = useState(0)
  const [responseFile, setResponseFile] = useState<File | null>(null)
  const [responseFileUrl, setResponseFileUrl] = useState<string | null>(null)
  const [responseFileType, setResponseFileType] = useState<'video' | 'audio' | null>(null)
  const [mediaTitle, setMediaTitle] = useState('')
  const [mediaDescription, setMediaDescription] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) {
          router.push('/login')
          return
        }

        setUser(currentUser)

        // Load reviewer profile to get reviewer title
        const { data: profile } = await supabase
          .from('profiles')
          .select('reviewer_title, full_name')
          .eq('id', currentUser.id)
          .single()

        if (profile?.reviewer_title) {
          setReviewerTitle(profile.reviewer_title)
        } else if (profile?.full_name) {
          // Fallback to full name if reviewer_title not set
          setReviewerTitle(profile.full_name)
        }

        const orderData = await getOrderById(orderId)
        const orderObj = orderData as Order

        // Check if order is already completed
        if (orderObj.status === 'completed') {
          toast({
            title: 'Review Already Submitted',
            description: 'This order has already been reviewed.',
            variant: 'destructive',
          })
          router.push('/dashboard/reviewer')
          return
        }

        setOrder(orderObj)
      } catch (err: any) {
        console.error('Error loading order:', err)
        setError(err.message || 'Failed to load order')
        toast({
          title: 'Error',
          description: err.message || 'Failed to load order',
          variant: 'destructive',
        })
        setTimeout(() => {
          router.push('/dashboard/reviewer')
        }, 2000)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      loadData()
    }
  }, [orderId, router, toast])

  // Initialize scorecard with all 16 metrics
  useEffect(() => {
    if (scorecard.length === 0 || scorecard.length !== SCORECARD_METRICS.length) {
      const initialized = SCORECARD_METRICS.map(metric => {
        const existing = scorecard.find(item => item.metric === metric)
        return existing || { metric, score: 5 }
      })
      setScorecard(initialized)
    }
  }, [])

  const sanitizeFileName = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf('.')
    const extension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex) : ''
    const nameWithoutExt = lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName

    const sanitized = nameWithoutExt
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')

    return sanitized + extension
  }

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        throw new Error('Not authenticated')
      }

      // Determine file type with strict validation
      const isVideo = file.type === 'video/mp4' || file.name.match(/\.mp4$/i)
      const isAudio = file.type === 'audio/mpeg' || file.type === 'audio/mp3' || file.name.match(/\.mp3$/i)

      if (!isVideo && !isAudio) {
        throw new Error('Please upload an MP4 video file or MP3 audio file')
      }

      // Enforce specific formats
      if (isVideo && !file.name.match(/\.mp4$/i) && file.type !== 'video/mp4') {
        throw new Error('Video files must be MP4 format')
      }

      if (isAudio && !file.name.match(/\.mp3$/i) && !file.type.match(/audio\/(mpeg|mp3)/)) {
        throw new Error('Audio files must be MP3 format')
      }

      const fileType = isVideo ? 'video' : 'audio'
      setResponseFileType(fileType)

      // Sanitize filename
      const sanitizedFileName = sanitizeFileName(file.name)
      const filePath = `reviews/${orderId}/${Date.now()}-${sanitizedFileName}`

      // Determine content type
      let contentType = file.type
      if (!contentType) {
        if (file.name.endsWith('.mp3')) contentType = 'audio/mpeg'
        else if (file.name.endsWith('.wav')) contentType = 'audio/wav'
        else if (file.name.endsWith('.m4a')) contentType = 'audio/mp4'
        else if (file.name.endsWith('.mp4')) contentType = 'video/mp4'
      }

      // Upload to reviews bucket (or submissions if reviews doesn't exist)
      const bucketName = 'reviews' // Try reviews bucket first
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: contentType,
        })

      // Fallback to submissions bucket if reviews doesn't exist
      let finalBucket = bucketName
      if (uploadError && uploadError.message.includes('not found')) {
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('submissions')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: contentType,
          })

        if (fallbackError) {
          throw fallbackError
        }
        finalBucket = 'submissions'
      } else if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(finalBucket)
        .getPublicUrl(filePath)

      setResponseFileUrl(urlData.publicUrl)
      setResponseFile(file)
    } catch (err: any) {
      console.error('Error uploading file:', err)
      setError(err.message || 'Failed to upload file')
      toast({
        title: 'Upload Failed',
        description: err.message || 'Failed to upload file',
        variant: 'destructive',
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const removeFile = () => {
    setResponseFile(null)
    setResponseFileUrl(null)
    setResponseFileType(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const requiredTypes = order?.requiredReviewTypes || []

      // Pro Studio Schema Validation
      if (!reviewerTitle || reviewerTitle.trim().length === 0) {
        setError('Reviewer title is required')
        setSubmitting(false)
        return
      }

      if (!summary || summary.trim().length < 100) {
        setError(`Summary is required and must be at least 100 characters (currently ${summary.trim().length} characters)`)
        setSubmitting(false)
        return
      }

      if (!tags || tags.length === 0) {
        setError('At least one tag is required')
        setSubmitting(false)
        return
      }

      if (overallRating === 0) {
        setError('Please provide an overall rating')
        setSubmitting(false)
        return
      }

      // Scorecard validation - must have exactly 16 items
      if (scorecard.length !== 16) {
        setError('Please complete all 16 scorecard criteria')
        setSubmitting(false)
        return
      }

      if (scorecard.some(item => !item.metric || typeof item.score !== 'number' || item.score < 1)) {
        setError('All scorecard metrics must have valid scores (1-10)')
        setSubmitting(false)
        return
      }

      // Written review validation (if required) - 1000 character minimum
      if (requiredTypes.includes('written')) {
        if (writtenFeedback.trim().length < 1000) {
          setError(`Written review is required and must be at least 1000 characters (currently ${writtenFeedback.trim().length} characters)`)
          setSubmitting(false)
          return
        }
      }

      // Video review validation (if required) - must be MP4
      if (requiredTypes.includes('video')) {
        if (!responseFileUrl || responseFileType !== 'video') {
          setError('Video review is required. Please upload an MP4 video file.')
          setSubmitting(false)
          return
        }
        if (!mediaTitle || mediaTitle.trim().length === 0) {
          setError('Video review title is required')
          setSubmitting(false)
          return
        }
        // Verify it's actually MP4
        if (responseFile && !responseFile.name.match(/\.mp4$/i) && responseFile.type !== 'video/mp4') {
          setError('Video review must be in MP4 format')
          setSubmitting(false)
          return
        }
      }

      // Audio review validation (if required) - must be MP3
      if (requiredTypes.includes('audio')) {
        if (!responseFileUrl || responseFileType !== 'audio') {
          setError('Audio review is required. Please upload an MP3 audio file.')
          setSubmitting(false)
          return
        }
        if (!mediaTitle || mediaTitle.trim().length === 0) {
          setError('Audio review title is required')
          setSubmitting(false)
          return
        }
        // Verify it's actually MP3
        if (responseFile && !responseFile.name.match(/\.mp3$/i) && !responseFile.type.match(/audio\/(mpeg|mp3)/)) {
          setError('Audio review must be in MP3 format')
          setSubmitting(false)
          return
        }
      }

      // Construct ReviewSubmissionPayload
      const payload: ReviewSubmissionPayload = {
        reviewerTitle: reviewerTitle.trim(),
        summary: summary.trim(),
        highlights: highlights.trim() || undefined,
        tags: tags,
        rating: overallRating,
        scorecard: scorecard,
        writtenFeedback: writtenFeedback.trim() || undefined,
      }

      // Add media if uploaded
      if (responseFileUrl && responseFileType) {
        payload.media = {
          type: responseFileType,
          url: responseFileUrl,
          title: mediaTitle.trim(),
          description: mediaDescription.trim() || '',
        }
      }

      await submitReview(orderId, payload, requiredTypes)

      toast({
        title: 'Review Submitted Successfully!',
        description: 'Your review has been saved and the order is now marked as completed.',
      })

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/reviewer')
      }, 1500)
    } catch (err: any) {
      console.error('Error submitting review:', err)
      setError(err.message || 'Failed to submit review')
      toast({
        title: 'Submission Failed',
        description: err.message || 'Failed to submit review',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6] mx-auto mb-4" />
          <p className="text-white/70">Loading review workspace...</p>
        </div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <header className="border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto flex h-16 items-center justify-between px-6">
            <Link href="/" className="text-xl font-bold text-white">
              Amplifyd Studio
            </Link>
            <NavbarAuth isAuthenticated={!!user} />
          </div>
        </header>
        <main className="container mx-auto p-6 lg:p-12 max-w-7xl">
          <Alert className="border-red-500/50 bg-red-500/10 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="text-red-300/80">
              {error}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  if (!order) {
    return null
  }

  const feedbackCharCount = writtenFeedback.length
  const requiredTypes = order?.requiredReviewTypes || []
  const requiresWritten = requiredTypes.includes('written')
  const requiresScorecard = requiredTypes.includes('scorecard')
  const requiresVideo = requiredTypes.includes('video')
  const requiresAudio = requiredTypes.includes('audio')
  const minChars = requiresWritten ? 1000 : 200

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
              onClick={() => router.push('/dashboard/reviewer')}
              className="text-white/70 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <NavbarAuth isAuthenticated={!!user} />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 lg:p-12 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Review Workspace</h1>
          <p className="text-white/70">Review and provide feedback for this track</p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="text-red-300/80">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Source Material (Sticky) */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Source Material
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-white/50 text-sm mb-1">Reviewing:</p>
                  <p className="text-white font-semibold text-lg">
                    {order.track_title || 'Untitled Track'}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm mb-1">Artist:</p>
                  <p className="text-white">
                    {order.artist?.full_name || 'Guest Artist'}
                  </p>
                </div>

                {/* Audio Player */}
                <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                  <audio
                    controls
                    className="w-full"
                    src={order.track_url}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>

                {/* Artist Note */}
                {order.note && (
                  <div className="rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <FileText className="h-4 w-4 text-[#C4B5FD] mt-0.5" />
                      <p className="text-white/70 text-sm font-medium">Artist Note:</p>
                    </div>
                    <p className="text-white/80 text-sm">{order.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Work Area (Scrollable) */}
          <div>
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Review Scorecard</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Required Review Types Info */}
                  {requiredTypes.length > 0 && (
                    <Alert className="border-blue-500/50 bg-blue-500/10 text-blue-400">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Required Review Components</AlertTitle>
                      <AlertDescription className="text-blue-300/80">
                        This package requires: {requiredTypes.map(type => {
                          const labels: Record<string, string> = {
                            scorecard: '16 Card Scorecard',
                            audio: 'Audio Review (MP3)',
                            video: 'Video Review (MP4)',
                            written: 'Written Review (1000+ chars)'
                          }
                          return labels[type] || type
                        }).join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Reviewer Title */}
                  <div className="space-y-2">
                    <Label htmlFor="reviewer-title" className="text-white">
                      Reviewer Title <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="reviewer-title"
                      value={reviewerTitle}
                      onChange={(e) => setReviewerTitle(e.target.value)}
                      className="bg-white/5 border-white/20 text-white"
                      placeholder="e.g., Mix Engineer, Songwriting Mentor"
                    />
                    <p className="text-white/50 text-xs">
                      Your professional title or role (e.g., "Mix Engineer", "Songwriting Mentor")
                    </p>
                  </div>

                  {/* 16-Point Scorecard */}
                  <div className="space-y-2">
                    {requiresScorecard && (
                      <div className="mb-4">
                        <Badge className="bg-[#8B5CF6]/20 text-[#C4B5FD] border-[#8B5CF6]/40 mb-2">
                          Required: 16 Card Scorecard
                        </Badge>
                      </div>
                    )}
                    <Label className="text-white">
                      Scorecard <span className="text-red-400">*</span>
                    </Label>
                    <ScorecardGrid value={scorecard} onChange={setScorecard} />
                    <p className="text-white/50 text-xs">
                      Rate each metric from 1-10. All 16 metrics are required.
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="text-white">
                      Tags <span className="text-red-400">*</span>
                    </Label>
                    <TagInput value={tags} onChange={setTags} />
                  </div>

                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="summary" className="text-white">
                        Summary <span className="text-red-400">*</span>
                      </Label>
                      <span className={`text-xs ${
                        summary.length < 100 
                          ? 'text-red-400' 
                          : summary.length < 150
                          ? 'text-yellow-400'
                          : 'text-white/50'
                      }`}>
                        {summary.length} / 100 characters (minimum)
                      </span>
                    </div>
                    <Textarea
                      id="summary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      placeholder="Provide a concise summary of your review (minimum 100 characters)..."
                    />
                    {summary.length < 100 && (
                      <p className="text-red-400 text-xs">
                        Summary must be at least 100 characters ({100 - summary.length} more needed)
                      </p>
                    )}
                  </div>

                  {/* Highlights (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="highlights" className="text-white">
                      Highlights (Optional)
                    </Label>
                    <Textarea
                      id="highlights"
                      value={highlights}
                      onChange={(e) => setHighlights(e.target.value)}
                      className="min-h-[80px] bg-white/5 border-white/20 text-white placeholder:text-white/40"
                      placeholder="Key takeaways or deliverables (optional)..."
                    />
                  </div>

                  {/* Written Feedback */}
                  <div className="space-y-2">
                    {requiresWritten && (
                      <div className="mb-2">
                        <Badge className="bg-[#8B5CF6]/20 text-[#C4B5FD] border-[#8B5CF6]/40">
                          Required: Written Review (1000+ characters)
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="written-feedback" className="text-white">
                        Written Feedback {requiresWritten && <span className="text-red-400">*</span>}
                      </Label>
                      <span className={`text-xs ${
                        feedbackCharCount < minChars 
                          ? 'text-red-400' 
                          : feedbackCharCount < minChars * 1.2
                          ? 'text-yellow-400'
                          : 'text-white/50'
                      }`}>
                        {feedbackCharCount} / {minChars} characters {requiresWritten ? '(required minimum)' : '(minimum)'}
                      </span>
                    </div>
                    <Textarea
                      id="written-feedback"
                      placeholder={requiresWritten 
                        ? "Provide detailed feedback about the track (minimum 1000 characters required). Be specific about what works well and what could be improved..."
                        : "Provide detailed feedback about the track. Be specific about what works well and what could be improved..."
                      }
                      value={writtenFeedback}
                      onChange={(e) => setWrittenFeedback(e.target.value)}
                      className="min-h-[200px] bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    />
                    {requiresWritten && feedbackCharCount < minChars && (
                      <p className="text-red-400 text-xs mt-1">
                        Written review is required. You need {minChars - feedbackCharCount} more characters.
                      </p>
                    )}
                  </div>

                  {/* Overall Rating */}
                  <div className="space-y-2">
                    <Label className="text-white">Overall Rating</Label>
                    <StarRating
                      value={overallRating}
                      onChange={setOverallRating}
                      max={5}
                    />
                  </div>

                  {/* Video/Audio Response Upload */}
                  <div className="space-y-2">
                    {(requiresVideo || requiresAudio) && (
                      <div className="mb-2">
                        <Badge className="bg-[#8B5CF6]/20 text-[#C4B5FD] border-[#8B5CF6]/40">
                          Required: {requiresVideo ? 'Video Review (MP4)' : 'Audio Review (MP3)'}
                        </Badge>
                      </div>
                    )}
                    <Label className="text-white">
                      {requiresVideo ? 'Video Response' : requiresAudio ? 'Audio Response' : 'Video/Audio Response'}
                      {(requiresVideo || requiresAudio) && <span className="text-red-400 ml-1">*</span>}
                      {!requiresVideo && !requiresAudio && ' (Optional)'}
                    </Label>
                    <div className="space-y-3">
                      {!responseFileUrl ? (
                        <div className="border-2 border-dashed border-white/20 rounded-lg p-6 bg-white/5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={requiresVideo 
                        ? "video/mp4,.mp4" 
                        : requiresAudio 
                        ? "audio/mpeg,audio/mp3,.mp3"
                        : "video/mp4,.mp4,audio/mpeg,audio/mp3,.mp3"}
                      onChange={handleFileChange}
                      className="hidden"
                      id="response-file"
                      disabled={uploadingFile}
                    />
                          <label
                            htmlFor="response-file"
                            className="flex flex-col items-center justify-center cursor-pointer"
                          >
                            {uploadingFile ? (
                              <>
                                <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6] mb-2" />
                                <p className="text-white/70 text-sm">Uploading...</p>
                              </>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-white/50 mb-2" />
                                <p className="text-white/70 text-sm mb-1">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-white/50 text-xs">
                                  {requiresVideo 
                                    ? 'MP4 video file only (max 100MB)' 
                                    : requiresAudio 
                                    ? 'MP3 audio file only (max 100MB)'
                                    : 'MP4 video or MP3 audio (max 100MB)'}
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-400" />
                              <div>
                                <p className="text-white font-medium text-sm">
                                  {responseFile?.name || 'File uploaded'}
                                </p>
                                <p className="text-white/50 text-xs">
                                  {responseFileType === 'video' ? 'Video' : 'Audio'} response ready
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeFile}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="media-title" className="text-white">
                              Media Title <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              id="media-title"
                              value={mediaTitle}
                              onChange={(e) => setMediaTitle(e.target.value)}
                              className="bg-white/5 border-white/20 text-white"
                              placeholder="e.g., Real-time Drop Rebuild, Lyric Rework Walkthrough"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="media-description" className="text-white">
                              Media Description (Optional)
                            </Label>
                            <Textarea
                              id="media-description"
                              value={mediaDescription}
                              onChange={(e) => setMediaDescription(e.target.value)}
                              className="min-h-[80px] bg-white/5 border-white/20 text-white placeholder:text-white/40"
                              placeholder="Describe what viewers/listeners will see or hear..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={
                      submitting || 
                      !reviewerTitle.trim() ||
                      summary.trim().length < 100 ||
                      tags.length === 0 ||
                      scorecard.length !== 16 ||
                      scorecard.some(item => !item.metric || item.score < 1) ||
                      overallRating === 0 || 
                      (requiresWritten && feedbackCharCount < minChars) ||
                      (requiresVideo && (!responseFileUrl || responseFileType !== 'video' || !mediaTitle.trim())) ||
                      (requiresAudio && (!responseFileUrl || responseFileType !== 'audio' || !mediaTitle.trim())) ||
                      uploadingFile
                    }
                    className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Review...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
