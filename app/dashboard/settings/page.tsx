import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NavbarAuth } from '@/components/navbar-auth'
import Link from 'next/link'
import { ArrowLeft, User, Settings as SettingsIcon } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, bio, email')
    .eq('id', user.id)
    .single()

  const role = (profile as any)?.role || 'user'

  // Redirect to role-specific settings if available
  if (role === 'reviewer') {
    redirect('/dashboard/reviewer/settings')
  }

  // For artists and other users, show a basic settings page
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

      <main className="container mx-auto p-6 lg:p-12 max-w-5xl">
        <div className="mb-8">
          <Button 
            asChild 
            variant="ghost" 
            className="mb-4 text-white/70 hover:text-white"
          >
            <Link href="/dashboard/artist">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/70">Manage your account settings</p>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-white/60">
              Your basic account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Full Name</Label>
              <Input
                id="name"
                value={profile?.full_name || user.email?.split('@')[0] || ''}
                disabled
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                value={user.email || ''}
                disabled
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            {profile?.bio && (
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  disabled
                  className="bg-white/5 border-white/20 text-white min-h-[100px]"
                />
              </div>
            )}
            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-white/70 mb-4">
                To update your profile, please contact support or use the reviewer settings if you're a reviewer.
              </p>
              <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Link href="/support">
                  Contact Support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

