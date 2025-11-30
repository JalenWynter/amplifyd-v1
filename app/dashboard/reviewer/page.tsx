import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NavbarAuth } from '@/components/navbar-auth'
import Link from 'next/link'
import { 
  DollarSign,
  Clock,
  Music,
  User,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Settings
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RealtimeOrdersListener } from '@/components/realtime-orders-listener'

export default async function ReviewerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify user is a reviewer and fetch full profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, verified, stripe_account_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'reviewer') {
    redirect('/dashboard')
  }

  // All reviewers are verified, so we set this to true
  const isVerified = true
  const hasStripeAccount = !!profile?.stripe_account_id

  // Fetch orders where reviewer_id matches the user and status is 'paid' or 'open'
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('reviewer_id', user.id)
    .in('status', ['paid', 'open'])
    .order('created_at', { ascending: false })

  // Calculate stats
  const completedOrders = orders?.filter(order => order.status === 'completed') || []
  const activeOrders = orders?.filter(order => order.status === 'paid' || order.status === 'open') || []
  
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
          <h1 className="text-4xl font-bold text-white mb-2">Reviewer Dashboard</h1>
          <p className="text-white/70">Manage your review queue and track earnings</p>
        </div>

        {/* Stripe Connection Banner */}
        {isVerified && !hasStripeAccount && (
          <Alert className="mb-6 border-blue-500/50 bg-blue-500/10 text-blue-400">
            <CreditCard className="h-4 w-4" />
            <AlertTitle>Connect Stripe to Get Paid</AlertTitle>
            <AlertDescription className="text-blue-300/80">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <span>Connect your Stripe account to receive payments for completed reviews.</span>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                  asChild
                >
                  <Link href="/dashboard/reviewer/settings">
                    Connect Stripe
                    <CreditCard className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl mb-6">
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
                <Link href="/dashboard/reviewer/reviews">
                  <Music className="mr-2 h-4 w-4" />
                  My Reviews
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="w-full justify-start border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/dashboard/reviewer/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings & Pricing
                </Link>
              </Button>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">${totalEarnings.toFixed(2)}</div>
              <p className="text-white/50 text-sm mt-1">{completedOrders.length} completed reviews</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                Active Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{activeOrders.length}</div>
              <p className="text-white/50 text-sm mt-1">Paid orders awaiting review</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Queue */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="h-5 w-5" />
              Active Queue
            </CardTitle>
            <CardDescription className="text-white/60">
              Tracks waiting for your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeOrders && activeOrders.length > 0 ? (
              <div className="space-y-3">
                {activeOrders.map((order: any) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-white font-medium">{order.track_title || 'Untitled Track'}</p>
                        <p className="text-white/50 text-sm mt-1">
                          {order.artist?.full_name || order.guest_email || 'Guest Artist'}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/70 text-sm">Price</p>
                        <p className="text-white font-semibold">${order.price_total}</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-sm">Status</p>
                        <Badge 
                          variant="default"
                          className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                      <Button 
                        asChild
                        className="ml-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                      >
                        <Link href={`/reviews/${order.id}/submit`}>
                          Start Review
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No pending reviews</p>
                <p className="text-white/30 text-sm mt-2">Your queue is empty</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Reviews */}
        {completedOrders && completedOrders.length > 0 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl mt-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Completed Reviews
              </CardTitle>
              <CardDescription className="text-white/60">
                Your completed review history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedOrders.slice(0, 5).map((order: any) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{order.track_title || 'Untitled Track'}</p>
                      <p className="text-white/50 text-sm mt-1">
                        Completed {new Date(order.updated_at || order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white/70 text-sm">Earned</p>
                        <p className="text-green-400 font-semibold">
                          ${(order.price_total - (order.platform_fee || 0)).toFixed(2)}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary"
                        className="bg-green-500/20 text-green-400 border-green-500/30"
                      >
                        completed
                      </Badge>
                    </div>
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

