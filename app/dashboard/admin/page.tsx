import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/app/auth/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NavbarAuth } from '@/components/navbar-auth'
import Link from 'next/link'
import { 
  Users, 
  Shield, 
  Mail,
  Calendar,
  Search,
  ArrowLeft
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PromoCodeAdmin } from '@/components/promo-code-admin'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminCheck = await isAdmin()
  if (!adminCheck) {
    redirect('/dashboard')
  }

  // Get all users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Get all tickets
  const { data: allTickets } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  // Get stats
  const totalUsers = profiles?.length || 0
  const adminUsers = profiles?.filter(p => p.role === 'admin').length || 0
  const openTickets = allTickets?.filter(t => t.status === 'open').length || 0
  const resolvedTickets = allTickets?.filter(t => t.status === 'resolved').length || 0

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
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="ghost" className="text-white/70">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-[#8B5CF6]" />
            <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
            <Badge className="bg-[#8B5CF6] text-white">Admin</Badge>
          </div>
          <p className="text-white/70 mt-2">Manage users, tickets, and system settings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Admin Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#8B5CF6]">{adminUsers}</div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Open Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{openTickets}</div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Resolved Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{resolvedTickets}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription className="text-white/60">
              View and manage all registered users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profiles && profiles.length > 0 ? (
                profiles.map((profile: any) => (
                  <div 
                    key={profile.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-[#C4B5FD]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{profile.email}</p>
                        <p className="text-white/50 text-sm">
                          Joined {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={profile.role === 'admin' ? 'default' : 'secondary'}
                        className={profile.role === 'admin' ? 'bg-[#8B5CF6] text-white' : ''}
                      >
                        {profile.role}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/50 text-center py-8">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Promo Code Management */}
        <PromoCodeAdmin />

        {/* Recent Tickets */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Recent Support Tickets
            </CardTitle>
            <CardDescription className="text-white/60">
              Monitor and manage support requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allTickets && allTickets.length > 0 ? (
                allTickets.map((ticket: any) => (
                  <div 
                    key={ticket.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{ticket.subject}</p>
                      <p className="text-white/50 text-sm mt-1">
                        {ticket.message?.substring(0, 100)}...
                      </p>
                      <p className="text-white/40 text-xs mt-2">
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
                ))
              ) : (
                <p className="text-white/50 text-center py-8">No tickets found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

