import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ReviewCard } from "@/components/review-card"
import { PublishedReview } from "@/types/reviews"
import { createClient } from "@/utils/supabase/server"

const PUBLISHED_REVIEWS: PublishedReview[] = [
  {
    id: "pub-001",
    reviewer: "Nova Quinn",
    reviewerTitle: "Mix Engineer",
    artist: "Luna Aster",
    trackTitle: "Neon Bloom",
    audioUrl: "https://cdn.pixabay.com/download/audio/2023/03/16/audio_fbd8d17419.mp3?filename=synthwave-ambient-loop-140353.mp3",
    summary:
      "Focused on tightening the low end and opening the mid-range guitars to give the chorus more bloom without sacrificing punch.",
    highlight: "Provided parallel compression chain and new stereo widener settings.",
    rating: 4.9,
    postedOn: "2024-12-02",
    tags: ["Mix Review", "Indie", "Punchy Low-End"],
    scorecard: [
      { metric: "Sub Energy", score: 8.5 },
      { metric: "Kick Clarity", score: 9 },
      { metric: "Snare Cut", score: 8 },
      { metric: "Stereo Spread", score: 9 },
      { metric: "Vocal Presence", score: 8.5 },
      { metric: "Dynamics", score: 8 },
      { metric: "Automation", score: 7.5 },
      { metric: "FX Cohesion", score: 8.5 },
      { metric: "Reference Match", score: 9 },
      { metric: "Headroom", score: 8.5 },
      { metric: "Phase Alignment", score: 9 },
      { metric: "Low-Mid Balance", score: 8 },
      { metric: "High Air", score: 8.5 },
      { metric: "Translation", score: 9 },
      { metric: "Creative Direction", score: 8 },
      { metric: "Overall Polish", score: 9.2 },
    ],
  },
  {
    id: "pub-002",
    reviewer: "Mara Sol",
    reviewerTitle: "Songwriting Mentor",
    artist: "Atlas V",
    trackTitle: "Hologram Hearts",
    audioUrl: "https://cdn.pixabay.com/download/audio/2023/04/01/audio_b649d0e6d2.mp3?filename=ambient-piano-143050.mp3",
    summary:
      "Mapped out a stronger verse narrative and added a pre-chorus lyric swap to make the hook land harder emotionally.",
    highlight: "Delivered a full lyric markup PDF with alternate rhyme options.",
    rating: 5,
    postedOn: "2025-01-14",
    tags: ["Songwriting", "Narrative", "Hook Doctor"],
    scorecard: [
      { metric: "Concept Clarity", score: 9.5 },
      { metric: "Lyric Imagery", score: 9 },
      { metric: "Rhyme Consistency", score: 8.5 },
      { metric: "Hook Strength", score: 9.8 },
      { metric: "Verse Momentum", score: 9 },
      { metric: "Pre-Chorus Lift", score: 9.2 },
      { metric: "Bridge Impact", score: 8 },
      { metric: "Story Arc", score: 9.4 },
      { metric: "Unique Angle", score: 8.8 },
      { metric: "Emotional Payoff", score: 9.6 },
      { metric: "Singability", score: 9.1 },
      { metric: "Topline Rhythm", score: 8.7 },
      { metric: "Title Fit", score: 9.2 },
      { metric: "Listener Memorability", score: 9.3 },
      { metric: "Release Readiness", score: 9.4 },
      { metric: "Overall", score: 9.5 },
    ],
    reviewerMedia: {
      type: "video",
      url: "https://cdn.coverr.co/videos/coverr-two-women-singing-4255/1080p.mp4",
      title: "Lyric Rework Walkthrough",
      description: "Mara walks through the lyric markups and performance notes.",
    },
  },
  {
    id: "pub-003",
    reviewer: "Kairo Vega",
    reviewerTitle: "EDM Sound Designer",
    artist: "Echo District",
    trackTitle: "Losing Signal",
    audioUrl: "https://cdn.pixabay.com/download/audio/2023/02/07/audio_4e2c760f40.mp3?filename=edm-128-bpm-13942.mp3",
    summary:
      "Rebuilt the drop with a more aggressive transient design and a wider mid-side balance so it translates in clubs.",
    highlight: "Shared custom Serum patch & FX rack to recreate the lead.",
    rating: 4.8,
    postedOn: "2025-03-03",
    tags: ["Drop Surgery", "EDM", "Sound Design"],
    scorecard: [
      { metric: "Drop Impact", score: 9.1 },
      { metric: "Transient Power", score: 8.8 },
      { metric: "Bass Definition", score: 8.5 },
      { metric: "Lead Character", score: 8.9 },
      { metric: "FX Transitions", score: 8.3 },
      { metric: "Build Tension", score: 8.7 },
      { metric: "Automation Detail", score: 8.4 },
      { metric: "Stereo Field", score: 8.6 },
      { metric: "Reverb Tail", score: 8 },
      { metric: "Kick/Bass Glue", score: 8.7 },
      { metric: "Drop Length", score: 8.2 },
      { metric: "Ear Candy", score: 8.9 },
      { metric: "Arrangement Energy", score: 8.5 },
      { metric: "Club Translation", score: 9 },
      { metric: "Reference Match", score: 8.6 },
      { metric: "Overall", score: 8.8 },
    ],
    reviewerMedia: {
      type: "audio",
      url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_d4184544a0.mp3?filename=energetic-epic-111447.mp3",
      title: "Real-time Drop Rebuild",
      description: "A recorded snippet where Kairo demonstrates the transient redesign.",
    },
  },
]

export default async function ReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
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
          {!user && (
            <div className="hidden lg:flex items-center gap-3 text-white/80 text-sm">
              <Link href="/login" className="px-3 py-2 rounded-full hover:bg-white/10">
                Sign In
              </Link>
              <Link href="/signup" className="px-4 py-2 rounded-full bg-white text-black font-semibold">
                Sign Up
              </Link>
            </div>
          )}
        </header>

        <div className="text-center space-y-4">
          <Badge className="border border-white/20 bg-white/10 text-white">Amplifyd Reviews</Badge>
          <h1 className="text-4xl font-bold text-white md:text-5xl">Completed Reviews</h1>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Listen to finished critiques, explore reviewer notes, and hear how artists level up after a professional session.
          </p>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          {PUBLISHED_REVIEWS.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </section>
      </div>
    </main>
  )
}


