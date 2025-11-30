'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NavbarAuth } from '@/components/navbar-auth'
import Link from 'next/link'
import { 
  Music,
  Clock,
  CheckCircle2,
  ArrowLeft,
  User,
  Star,
  FileText,
  ChevronDown,
  ChevronUp,
  Play,
  Loader2,
  DollarSign
} from 'lucide-react'
import { getReviewerOrdersWithReviews } from '@/app/actions/orders'
import { RealtimeOrdersListener } from '@/components/realtime-orders-listener'

export default function ReviewerReviewsPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

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

        // Get user profile to verify they're a reviewer
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        if (!profile || profile.role !== 'reviewer') {
          router.push('/dashboard')
          return
        }

        // Get orders with reviews
        const ordersData = await getReviewerOrdersWithReviews()
        setOrders(ordersData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6] mx-auto mb-4" />
          <p className="text-white/70">Loading reviews...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="mr-1 h-3 w-3" />
            Pending Payment
          </Badge>
        )
      case 'paid':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Clock className="mr-1 h-3 w-3" />
            In Review
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        )
    }
  }

  // Calculate stats
  const totalOrders = orders.length
  const pendingOrders = orders.filter(order => order.status === 'pending').length
  const paidOrders = orders.filter(order => order.status === 'paid').length
  const completedOrders = orders.filter(order => order.status === 'completed')
  
  // Calculate total earnings
  const totalEarnings = completedOrders.reduce((sum, order) => {
    const reviewerEarnings = order.price_total - (order.platform_fee || 0)
    return sum + reviewerEarnings
  }, 0)

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <RealtimeOrdersListener />
      <header className="border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-white">
            Amplifyd Studio
          </Link>
          <div className="flex items-center gap-4">
            <NavbarAuth isAuthenticated={!!user} />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 lg:p-12 max-w-7xl">
        <div className="mb-8">
          <Button 
            asChild 
            variant="ghost" 
            className="mb-4 text-white/70 hover:text-white"
          >
            <Link href="/dashboard/reviewer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">My Reviews</h1>
          <p className="text-white/70">Track all the reviews you've purchased and completed</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <Music className="h-5 w-5 text-purple-400" />
                Total Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalOrders}</div>
              <p className="text-white/50 text-sm mt-1">Purchased reviews</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{pendingOrders}</div>
              <p className="text-white/50 text-sm mt-1">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                In Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{paidOrders}</div>
              <p className="text-white/50 text-sm mt-1">Being reviewed</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">${totalEarnings.toFixed(2)}</div>
              <p className="text-white/50 text-sm mt-1">{completedOrders.length} completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="h-5 w-5" />
              Your Review Purchases
            </CardTitle>
            <CardDescription className="text-white/60">
              All tracks you've purchased for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order: any) => {
                  const review = order.reviews && order.reviews.length > 0 ? order.reviews[0] : null
                  const isExpanded = expandedOrders.has(order.id)
                  const reviewerEarnings = order.status === 'completed' 
                    ? (order.price_total - (order.platform_fee || 0)).toFixed(2)
                    : null
                  return (
                    <div 
                      key={order.id} 
                      className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors overflow-hidden"
                    >
                      {/* Header - Clickable */}
                      <div 
                        className="p-4 cursor-pointer"
                        onClick={() => toggleExpand(order.id)}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-2">
                              <Music className="h-5 w-5 text-white/50 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-white font-semibold text-lg">
                                    {order.track_title || 'Untitled Track'}
                                  </h3>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-white/50 hover:text-white"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleExpand(order.id)
                                    }}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>
                                      Artist: {order.artist?.full_name || order.guest_email || 'Unknown'}
                                    </span>
                                  </div>
                                  <div>
                                    Purchased: {new Date(order.created_at).toLocaleDateString()}
                                  </div>
                                  {review && (
                                    <div>
                                      Reviewed: {new Date(review.created_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(order.status)}
                              {order.status === 'paid' && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                                >
                                  <Link href={`/reviews/${order.id}/submit`}>
                                    Start Review
                                  </Link>
                                </Button>
                              )}
                            </div>
                            <div className="text-right">
                              {reviewerEarnings ? (
                                <>
                                  <p className="text-white/70 text-sm">Earned</p>
                                  <p className="text-green-400 font-semibold">${reviewerEarnings}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-white/70 text-sm">Price</p>
                                  <p className="text-white font-semibold">${order.price_total}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Content - Audio Player */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-white/10 pt-4">
                          <div className="space-y-4">
                            {/* Audio Player */}
                            {order.track_url && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <Play className="h-4 w-4 text-white/70" />
                                  <span className="text-white/70 text-sm font-medium">Track Audio</span>
                                </div>
                                <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                                  <audio
                                    controls
                                    className="w-full"
                                    src={order.track_url}
                                    onError={(e) => {
                                      const audioElement = e.currentTarget
                                      console.error("Audio Error:", {
                                        error: audioElement.error,
                                        errorCode: audioElement.error?.code,
                                        errorMessage: audioElement.error?.message,
                                        src: audioElement.src,
                                        networkState: audioElement.networkState,
                                        readyState: audioElement.readyState
                                      })
                                    }}
                                  >
                                    Your browser does not support the audio element.
                                  </audio>
                                </div>
                                {/* Debug Box */}
                                <div className="mt-2 p-2 bg-red-900/20 text-red-200 text-xs font-mono break-all rounded border border-red-500/30">
                                  <p><strong>Debug URL:</strong> {order.track_url}</p>
                                  <p><strong>Bucket Path:</strong> {order.track_url?.split('/submissions/')[1] || 'Could not parse'}</p>
                                </div>
                              </div>
                            )}

                            {/* Review Details */}
                            {review && (
                              <div className="mt-4 space-y-4">
                                <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                    <span className="text-white font-medium">
                                      Overall Rating: {review.overall_rating}/10
                                    </span>
                                  </div>
                                  {review.summary && (
                                    <div className="mt-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <FileText className="h-4 w-4 text-white/50" />
                                        <span className="text-white/70 text-sm font-medium">Summary:</span>
                                      </div>
                                      <p className="text-white/80 text-sm mt-1 pl-6 line-clamp-3">
                                        {review.summary}
                                      </p>
                                    </div>
                                  )}
                                  {review.written_feedback && (
                                    <div className="mt-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <FileText className="h-4 w-4 text-white/50" />
                                        <span className="text-white/70 text-sm font-medium">Feedback:</span>
                                      </div>
                                      <p className="text-white/80 text-sm mt-1 pl-6 line-clamp-3">
                                        {review.written_feedback}
                                      </p>
                                    </div>
                                  )}
                                  {review.video_url && (
                                    <div className="mt-2">
                                      <a 
                                        href={review.video_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                      >
                                        Watch Video Review →
                                      </a>
                                    </div>
                                  )}
                                  {review.audio_url && (
                                    <div className="mt-2">
                                      <a 
                                        href={review.audio_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                      >
                                        Listen to Audio Review →
                                      </a>
                                    </div>
                                  )}
                                </div>
                                
                                {/* View Full Review Report Button */}
                                {order.status === 'completed' && (
                                  <Button
                                    asChild
                                    className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                                  >
                                    <Link href={`/orders/${order.id}/review`}>
                                      View Full Review Report
                                      <FileText className="h-4 w-4 ml-2" />
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 text-lg mb-2">No review purchases yet</p>
                <p className="text-white/30 text-sm mb-4">
                  Purchase your first review to get started
                </p>
                <Button 
                  asChild
                  className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                >
                  <Link href="/marketplace">
                    Browse Marketplace
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

