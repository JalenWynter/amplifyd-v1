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
  Users
} from 'lucide-react'

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

  // Get user's support tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
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
                    {userRole}
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
                <Link href="/support">
                  <FileText className="mr-2 h-4 w-4" />
                  Support Tickets
                </Link>
              </Button>
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

          {/* Stats Card */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Support Tickets</span>
                  <span className="text-white font-semibold">{tickets?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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

