import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ReviewCard } from "@/components/review-card"
import { getPublicReviews } from "@/app/actions/public-reviews"
import { createClient } from "@/utils/supabase/server"
import { NavbarAuth } from "@/components/navbar-auth"

// Force dynamic rendering to ensure signed URLs are always fresh
export const dynamic = 'force-dynamic'

export default async function ReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch public reviews from database
  const reviews = await getPublicReviews(12)
  
  // Get user role to determine dashboard
  let dashboardLink = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const role = (profile as any)?.role
    if (role === 'reviewer') {
      dashboardLink = '/dashboard/reviewer'
    } else if (role === 'artist') {
      dashboardLink = '/dashboard/artist'
    } else if (role === 'admin') {
      dashboardLink = '/dashboard/admin'
    } else {
      dashboardLink = '/dashboard/artist' // Default fallback
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] py-12 px-6">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-2xl font-bold text-white transition hover:text-[#C4B5FD]">
              Amplifyd Studio
            </Link>
            <nav className="flex items-center gap-3 lg:hidden text-sm text-white/70">
              <Link href="/marketplace" className="rounded-full bg-white/10 px-4 py-2 text-white">
                Marketplace
              </Link>
              <Link href="/reviews" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
                Reviews
              </Link>
              {dashboardLink && (
                <Link href={dashboardLink} className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
                  Dashboard
                </Link>
              )}
              <Link href="/about" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
                About
              </Link>
            </nav>
          </div>
          <nav className="hidden lg:flex items-center gap-3 text-sm font-semibold text-white/70">
            <Link href="/marketplace" className="rounded-full bg-white/10 px-4 py-2 text-white">
              Marketplace
            </Link>
            <Link href="/reviews" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              Reviews
            </Link>
            {dashboardLink && (
              <Link href={dashboardLink} className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
                Dashboard
              </Link>
            )}
            <Link href="/about" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              About
            </Link>
            <Link href="/support" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              Contact
            </Link>
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <NavbarAuth isAuthenticated={!!user} />
          </div>
        </header>

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <Badge className="border border-white/20 bg-white/10 text-white">Amplifyd Reviews</Badge>
          <h1 className="text-4xl font-bold text-white md:text-5xl">Hear the Difference.</h1>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Real feedback from real professionals.
          </p>
        </div>

        {/* Reviews Grid */}
        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-white/70 mb-4">Be the first to get reviewed!</p>
            <Link 
              href="/marketplace" 
              className="inline-block px-6 py-3 bg-[#8B5CF6] text-white rounded-full font-semibold hover:bg-[#7C3AED] transition-colors"
            >
              Find a Reviewer
            </Link>
          </div>
        ) : (
          <section className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}


