import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/app/auth/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NavbarAuth } from '@/components/navbar-auth'
import Link from 'next/link'
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Settings,
  ArrowRight,
  FileText,
  Users,
  Music,
  AlertCircle,
  CheckCircle2,
  Star,
  TrendingUp,
  Upload
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getArtistOrdersWithReviews } from '@/app/actions/orders'
import { RealtimeOrdersListener } from '@/components/realtime-orders-listener'

export default async function ArtistDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'user'
  const isUserAdmin = userRole === 'admin'
  const displayRole = userRole === 'user' ? 'Artist' : userRole

  // Get user's support tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Check email verification
  const isEmailVerified = !!user.email_confirmed_at || user.email_verified || false

  // Get all orders with reviews for stats
  const orders = await getArtistOrdersWithReviews()
  
  // Calculate comprehensive stats
  const totalTracks = orders.length
  const hasOrders = totalTracks > 0
  const pendingTracks = orders.filter((o: any) => o.status === 'pending').length
  const inReviewTracks = orders.filter((o: any) => o.status === 'paid').length
  const completedTracks = orders.filter((o: any) => o.status === 'completed').length
  
  // Get reviews received
  const reviewsReceived = orders
    .filter((o: any) => o.reviews && o.reviews.length > 0)
    .map((o: any) => o.reviews[0])
  
  const totalReviews = reviewsReceived.length
  const averageRating = reviewsReceived.length > 0
    ? (reviewsReceived.reduce((sum: number, r: any) => sum + (r.overall_rating || 0), 0) / reviewsReceived.length).toFixed(1)
    : '0.0'

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
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/70">Welcome back, {user.email}</p>
        </div>

        {/* Email Verification Banner - Only show if email not verified */}
        {!isEmailVerified && (
          <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10 text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verify Your Email</AlertTitle>
            <AlertDescription className="text-yellow-300/80">
              Please verify your email address to unlock all platform features. Check your inbox for the verification link.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload First Track Banner - Only show if email verified but no tracks */}
        {isEmailVerified && !hasOrders && (
          <Alert className="mb-6 border-blue-500/50 bg-blue-500/10 text-blue-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ready to Get Started?</AlertTitle>
            <AlertDescription className="text-blue-300/80">
              Upload your first track for review to unlock full access to support and all platform features.
              <Button 
                asChild
                variant="outline"
                className="ml-4 mt-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
              >
                <Link href="/marketplace">
                  Browse Marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* User Info Card */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-white/50" />
                <span className="text-white/80 text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-white/50" />
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-sm">Role:</span>
                  <Badge 
                    variant={isUserAdmin ? "default" : "secondary"}
                    className={isUserAdmin ? "bg-[#8B5CF6] text-white" : ""}
                  >
                    {displayRole}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-white/50" />
                <span className="text-white/80 text-sm">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                asChild 
                variant="outline" 
                className="w-full justify-start border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/dashboard/artist/tracks">
                  <Music className="mr-2 h-4 w-4" />
                  My Track Reviews
                </Link>
              </Button>
              {isEmailVerified ? (
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full justify-start border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href="/support">
                    <FileText className="mr-2 h-4 w-4" />
                    Support Tickets
                  </Link>
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-white/20 bg-white/5 text-white opacity-50 cursor-not-allowed"
                  disabled
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Support Tickets
                  <AlertCircle className="ml-auto h-3 w-3" />
                </Button>
              )}
              {!isEmailVerified && (
                <p className="text-yellow-400/70 text-xs mt-1 px-2">
                  Verify your email to access support
                </p>
              )}
              {isUserAdmin && (
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full justify-start border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] hover:bg-[#8B5CF6]/20"
                >
                  <Link href="/dashboard/admin">
                    <Users className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </Button>
              )}
              <Button 
                asChild 
                variant="outline" 
                className="w-full justify-start border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/marketplace">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Browse Marketplace
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* My Stats Section */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              My Stats
            </CardTitle>
            <CardDescription className="text-white/60">
              Overview of your account status and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Account Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Shield className="h-4 w-4" />
                  Account Status
                </div>
                <div className="flex items-center gap-2">
                  {isEmailVerified ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <span className="text-white font-semibold">Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                      <span className="text-white font-semibold">Unverified</span>
                    </>
                  )}
                </div>
                <p className="text-white/50 text-xs">
                  {isEmailVerified ? 'Email confirmed' : 'Verify email to continue'}
                </p>
              </div>

              {/* Tracks Uploaded */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Upload className="h-4 w-4" />
                  Tracks Uploaded
                </div>
                <div className="text-2xl font-bold text-white">{totalTracks}</div>
                <div className="flex gap-2 text-xs text-white/50">
                  <span>{pendingTracks} pending</span>
                  <span>•</span>
                  <span>{inReviewTracks} in review</span>
                  <span>•</span>
                  <span>{completedTracks} completed</span>
                </div>
              </div>

              {/* Reviews Received */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Star className="h-4 w-4" />
                  Reviews Received
                </div>
                <div className="text-2xl font-bold text-white">{totalReviews}</div>
                {totalReviews > 0 && (
                  <div className="flex items-center gap-1 text-xs text-white/50">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>Avg: {averageRating}/10</span>
                  </div>
                )}
                {totalReviews === 0 && (
                  <p className="text-white/50 text-xs">No reviews yet</p>
                )}
              </div>

              {/* Support Tickets */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <FileText className="h-4 w-4" />
                  Support Tickets
                </div>
                <div className="text-2xl font-bold text-white">{tickets?.length || 0}</div>
                <p className="text-white/50 text-xs">
                  {hasOrders ? 'Full support access' : 'Submit track to unlock'}
                </p>
              </div>
            </div>

            {/* Additional Stats Row */}
            {hasOrders && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="text-white/70 text-sm mb-1">Pending Reviews</div>
                    <div className="text-2xl font-bold text-yellow-400">{pendingTracks}</div>
                    <div className="text-white/50 text-xs mt-1">Awaiting payment</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="text-white/70 text-sm mb-1">In Review</div>
                    <div className="text-2xl font-bold text-blue-400">{inReviewTracks}</div>
                    <div className="text-white/50 text-xs mt-1">Being reviewed</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="text-white/70 text-sm mb-1">Completed</div>
                    <div className="text-2xl font-bold text-green-400">{completedTracks}</div>
                    <div className="text-white/50 text-xs mt-1">Reviews finished</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        {tickets && tickets.length > 0 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Support Tickets
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-white/70">
                  <Link href="/support">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tickets.map((ticket: any) => (
                  <div 
                    key={ticket.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{ticket.subject}</p>
                      <p className="text-white/50 text-sm mt-1">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        ticket.status === 'open' ? 'default' : 
                        ticket.status === 'resolved' ? 'secondary' : 'outline'
                      }
                      className={
                        ticket.status === 'open' ? 'bg-[#8B5CF6] text-white' : 
                        ticket.status === 'resolved' ? 'bg-green-500/20 text-green-400' : ''
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

