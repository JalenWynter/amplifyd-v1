"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  Loader2,
  Star,
  Clock,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { NavbarAuth } from "@/components/navbar-auth"
import { createClient } from "@/utils/supabase/client"
import { Toggle } from "@/components/ui/toggle"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type ReviewerPackage = {
  title: string
  price: number
  description: string
  deliveryTime: string
  revisions: number
  features: string[]
}

type Reviewer = {
  id: string
  name: string
  avatar: string
  verified: boolean
  tags: string[]
  rating: number
  reviewCount: number
  startingPrice: number
  bio: string
  packages: ReviewerPackage[]
}

const BASE_REVIEWERS: Reviewer[] = [
  {
    id: "rev-001",
    name: "Nova Quinn",
    avatar: "/placeholder-user.jpg",
    verified: true,
    tags: ["Trap", "Mixing", "Vocals"],
    rating: 4.9,
    reviewCount: 312,
    startingPrice: 95,
    bio: "Nova is a Grammy-nominated mix engineer specializing in vocal clarity and low-end punch for modern trap records. With over 10 years of experience working with billboard charting artists, she brings major label quality to independent releases.",
    packages: [
      {
        title: "Quick Feedback",
        price: 95,
        description: "48-hour turnaround with actionable notes on your mix balance and vocal processing.",
        deliveryTime: "2 days",
        revisions: 0,
        features: ["Written PDF Report", "Mix Balance Check", "Vocal Chain Advice", "Actionable Next Steps"],
      },
      {
        title: "Full Mix Review",
        price: 195,
        description: "Detailed mix critique with timestamps, reference track comparisons, and specific plugin recommendations.",
        deliveryTime: "3 days",
        revisions: 1,
        features: ["Detailed Timestamped Notes", "Reference Comparison", "Plugin Preset Recommendations", "1 Follow-up Email"],
      },
      {
        title: "Premium Session",
        price: 395,
        description: "Live 60-minute Zoom session where we open your project (or stems) and fix issues in real-time.",
        deliveryTime: "5 days",
        revisions: 2,
        features: ["60-min Live Video Call", "Live Project/Stem Review", "Custom Revision Plan", "Recording of Session"],
      },
    ],
  },
  {
    id: "rev-002",
    name: "Atlas Reed",
    avatar: "/placeholder-user.jpg",
    verified: true,
    tags: ["House", "Sound Design", "Mastering"],
    rating: 4.8,
    reviewCount: 204,
    startingPrice: 110,
    bio: "Atlas brings festival-ready polish to melodic house and techno, focusing on energy flow and low-end translation. His masters have been played on the world's biggest stages.",
    packages: [
      {
        title: "Dancefloor Check",
        price: 110,
        description: "Club reference check with tonal balance report to ensure your track hits hard on big systems.",
        deliveryTime: "2 days",
        revisions: 0,
        features: ["Low-End Analysis", "Stereo Image Check", "Loudness Report", "Club Readiness Score"],
      },
      {
        title: "Mastering Notes",
        price: 220,
        description: "Comprehensive mastering critique with LUFS targets, dynamic range analysis, and EQ suggestions.",
        deliveryTime: "4 days",
        revisions: 1,
        features: ["Full Mastering Critique", "Dynamic Range Analysis", "EQ & Compression Tips", "Streaming Platform Prep"],
      },
      {
        title: "VIP Residency",
        price: 450,
        description: "Monthly mentorship with shared project board to guide your EP or album to completion.",
        deliveryTime: "30 days",
        revisions: 4,
        features: ["4 Weekly Check-ins", "Shared Trello/Notion Board", "Unlimited Quick Questions", "Final Master Polish"],
      },
    ],
  },
  {
    id: "rev-003",
    name: "Mara Sol",
    avatar: "/placeholder-user.jpg",
    verified: false,
    tags: ["Indie", "Songwriting", "Production"],
    rating: 4.95,
    reviewCount: 158,
    startingPrice: 80,
    bio: "Mara mentors indie artists on storytelling, arrangement dynamics, and vocal production for sync placements. Her own songs have been featured in top Netflix series.",
    packages: [
      {
        title: "Lyric Audit",
        price: 80,
        description: "Narrative-focused review checking for prosody, rhyme schemes, and emotional impact.",
        deliveryTime: "3 days",
        revisions: 0,
        features: ["Line-by-Line Lyric Analysis", "Rhyme Scheme Suggestions", "Emotional Arc Check", "Title Alternatives"],
      },
      {
        title: "Production Deep Dive",
        price: 165,
        description: "Arrangement critique with instrument balance tips to make your indie track sound expensive.",
        deliveryTime: "5 days",
        revisions: 1,
        features: ["Arrangement Structure Edit", "Instrumentation Review", "Vocal Production Tips", "Sync Potential Rating"],
      },
      {
        title: "Complete Blueprint",
        price: 320,
        description: "Full roadmap covering songwriting, production, and release strategy for your single.",
        deliveryTime: "7 days",
        revisions: 2,
        features: ["Song & Production Review", "Release Timeline Creation", "Pitching Strategy", "Asset Checklist"],
      },
    ],
  },
  {
    id: "rev-004",
    name: "Kairo Vega",
    avatar: "/placeholder-user.jpg",
    verified: true,
    tags: ["EDM", "Mastering", "Sound Design"],
    rating: 4.87,
    reviewCount: 189,
    startingPrice: 120,
    bio: "Kairo crafts high-impact EDM drops, ensuring low-end translation across arenas and streaming. He specializes in Dubstep, Future Bass, and Drum & Bass.",
    packages: [
      {
        title: "Drop Surgery",
        price: 120,
        description: "Detailed low-end & transient report specifically for your drop to make it hit harder.",
        deliveryTime: "2 days",
        revisions: 0,
        features: ["Kick & Bass Phase Check", "Transient Shaping Tips", "Sidechain Analysis", "Impact Assessment"],
      },
      {
        title: "Headliner Master",
        price: 260,
        description: "Mastering critique with limiter settings and LUFS targets for competitive loudness.",
        deliveryTime: "4 days",
        revisions: 1,
        features: ["Competitive Loudness targets", "Limiter Settings Guide", "Frequency Balance Report", "Stem Mastering Tips"],
      },
      {
        title: "Signature Session",
        price: 420,
        description: "Live design session focusing on synth & FX balance to define your unique sound.",
        deliveryTime: "6 days",
        revisions: 2,
        features: ["90-min Live Sound Design", "Serum/Vital Patch Reviews", "FX Chain Breakdown", "Custom Sample Pack"],
      },
    ],
  },
  {
    id: "rev-005",
    name: "Ivy Monroe",
    avatar: "/placeholder-user.jpg",
    verified: false,
    tags: ["Pop", "Songwriting", "Vocal Production"],
    rating: 4.93,
    reviewCount: 276,
    startingPrice: 105,
    bio: "Ivy helps pop vocalists craft radio-ready stacks with pristine tuning and emotive delivery. She has vocal produced for top 40 artists.",
    packages: [
      {
        title: "Hook Audit",
        price: 105,
        description: "Melodic & lyric feedback with harmony suggestions to make your chorus stuck in heads.",
        deliveryTime: "2 days",
        revisions: 0,
        features: ["Melody & Hook Analysis", "Harmony Layering Ideas", "Catchiness Score", "Lyric Tweaks"],
      },
      {
        title: "Vocal Stack Review",
        price: 215,
        description: "Critique focusing on tuning, compression, and FX for a professional vocal sound.",
        deliveryTime: "4 days",
        revisions: 1,
        features: ["Tuning Accuracy Check", "Compression Settings", "Reverb/Delay Throw Ideas", "De-essing Advice"],
      },
      {
        title: "Full Release Plan",
        price: 360,
        description: "Arrangement critique + marketing plan to launch your pop single effectively.",
        deliveryTime: "7 days",
        revisions: 2,
        features: ["Production Polish Notes", "Social Media Content Plan", "Spotify Pitching Guide", "Image Consulting"],
      },
    ],
  },
  {
    id: "rev-006",
    name: "Sage O'Connor",
    avatar: "/placeholder-user.jpg",
    verified: true,
    tags: ["Ambient", "Mixing", "Mastering"],
    rating: 4.85,
    reviewCount: 142,
    startingPrice: 85,
    bio: "Sage brings cinematic depth to ambient and neo-classical projects with focus on width and spatial FX. Perfect for composers and experimental artists.",
    packages: [
      {
        title: "Texture Review",
        price: 85,
        description: "Feedback on pads, drones, and spatial texture to add depth to your composition.",
        deliveryTime: "3 days",
        revisions: 0,
        features: ["Texture Layering Tips", "Frequency Masking Check", "Atmosphere Enhancement", "Sample Selection"],
      },
      {
        title: "Spatial Mix Audit",
        price: 175,
        description: "3D audio critique with reverb & delay insights for an immersive listening experience.",
        deliveryTime: "5 days",
        revisions: 1,
        features: ["Stereo Field Analysis", "Reverb Depth Check", "Binaural Processing Tips", "Panning Strategy"],
      },
      {
        title: "Complete Atmos Pass",
        price: 330,
        description: "Full review with Dolby Atmos prep checklist and object placement suggestions.",
        deliveryTime: "8 days",
        revisions: 2,
        features: ["Dolby Atmos Readiness", "Object Placement Ideas", "Bed Track Balance", "Immersive Master Check"],
      },
    ],
  },
]

const DUPLICATION_FACTOR = 4
const MOCK_REVIEWERS: Reviewer[] = Array.from({ length: DUPLICATION_FACTOR }, (_, index) =>
  BASE_REVIEWERS.map((reviewer) => ({
    ...reviewer,
    id: `${reviewer.id}-${index}`,
    name: `${reviewer.name} ${index === 0 ? "" : `•${index + 1}`}`.trim(),
  })),
).flat()

const TAG_OPTIONS = Array.from(new Set(MOCK_REVIEWERS.flatMap((reviewer) => reviewer.tags))).sort()

const PRICE_RANGE = MOCK_REVIEWERS.reduce(
  (acc, reviewer) => ({
    min: Math.min(acc.min, reviewer.startingPrice),
    max: Math.max(acc.max, reviewer.startingPrice),
  }),
  { min: Number.MAX_SAFE_INTEGER, max: 0 },
)

type SortOption = "rating" | "price-asc" | "price-desc" | "reviews"

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Highest Rated", value: "rating" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Review Count", value: "reviews" },
]

function useReviewerFilters(reviewers: Reviewer[]) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: PRICE_RANGE.min,
    max: PRICE_RANGE.max,
  })
  const [sortOption, setSortOption] = useState<SortOption>("rating")

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    )
  }

  const updatePrice = (key: "min" | "max", value: number) => {
    setPriceRange((prev) => ({
      ...prev,
      [key]: Number.isNaN(value) ? prev[key] : value,
    }))
  }

  const filteredReviewers = useMemo(() => {
    const filtered = reviewers.filter((reviewer) => {
      const matchesTags =
        selectedTags.length === 0 || selectedTags.every((tag) => reviewer.tags.includes(tag))
      const withinPrice =
        reviewer.startingPrice >= priceRange.min && reviewer.startingPrice <= priceRange.max
      return matchesTags && withinPrice
    })

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "price-asc":
          return a.startingPrice - b.startingPrice
        case "price-desc":
          return b.startingPrice - a.startingPrice
        case "reviews":
          return b.reviewCount - a.reviewCount
        case "rating":
        default:
          return b.rating - a.rating
      }
    })
  }, [reviewers, selectedTags, priceRange, sortOption])

  return {
    filteredReviewers,
    selectedTags,
    toggleTag,
    priceRange,
    updatePrice,
    sortOption,
    setSortOption,
  }
}

function useInfiniteReviewers(reviewers: Reviewer[], pageSize = 6) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [isLoading, setIsLoading] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisibleCount(pageSize)
  }, [pageSize, reviewers])

  const hasMore = visibleCount < reviewers.length

  useEffect(() => {
    const sentinel = loadMoreRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading && hasMore) {
          setIsLoading(true)
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + pageSize, reviewers.length))
            setIsLoading(false)
          }, 500)
        }
      },
      { rootMargin: "200px" },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasMore, isLoading, pageSize, reviewers.length])

  return {
    visibleReviewers: reviewers.slice(0, visibleCount),
    loadMoreRef,
    isLoading,
    hasMore,
  }
}

export default function MarketplacePage() {
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null)
  const [open, setOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const {
    filteredReviewers,
    selectedTags,
    toggleTag,
    priceRange,
    updatePrice,
    sortOption,
    setSortOption,
  } = useReviewerFilters(MOCK_REVIEWERS)
  const { visibleReviewers, loadMoreRef, isLoading, hasMore } = useInfiniteReviewers(filteredReviewers)

  useEffect(() => {
    const supabase = createClient()

    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }

    fetchSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchSession()
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSelect = (reviewer: Reviewer) => {
    setSelectedReviewer(reviewer)
    setOpen(true)
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] py-12 px-6">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-2xl font-bold text-white transition hover:text-[#C4B5FD]">
              Amplifyd Studio
            </Link>
            <div className="flex items-center gap-3 lg:hidden">
              <NavbarAuth isAuthenticated={isAuthenticated} />
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold text-white/70">
            <Link href="/marketplace" className="rounded-full bg-white/10 px-4 py-2 text-white">
              Marketplace
            </Link>
            <Link href="/pricing" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              Pricing
            </Link>
            <Link href="/about" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              About
            </Link>
            <Link href="/contact" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              Contact
            </Link>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <NavbarAuth isAuthenticated={isAuthenticated} />
          </div>
        </header>

        <div className="space-y-4 text-center">
          <Badge className="border border-white/20 bg-white/10 text-white">Amplifyd Marketplace</Badge>
          <h1 className="text-4xl font-bold text-white md:text-5xl">Find Your Professional</h1>
          <p className="text-lg text-white/70">
            Browse vetted reviewers who specialize in elevating your sound with precise critique and actionable direction.
          </p>
        </div>

        <section className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <FilterPanel
            tags={TAG_OPTIONS}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            priceRange={priceRange}
            updatePrice={updatePrice}
            sortOption={sortOption}
            onSortChange={setSortOption}
          />

          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm text-white/70">
                Showing <span className="font-semibold text-white">{visibleReviewers.length}</span> of{" "}
                <span className="font-semibold text-white">{filteredReviewers.length}</span> reviewers
              </p>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <SelectTrigger className="w-48 border-white/20 bg-white/10 text-white">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] text-white">
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {visibleReviewers.map((reviewer) => (
                <ReviewerCard key={reviewer.id} reviewer={reviewer} onSelect={handleSelect} />
              ))}
            </div>

            <div ref={loadMoreRef} className="flex flex-col items-center justify-center py-8">
              {isLoading && (
                <div className="flex items-center gap-2 text-white/70">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading more reviewers...
                </div>
              )}
              {!hasMore && !isLoading && (
                <p className="text-sm text-white/50">All reviewers loaded</p>
              )}
            </div>
          </div>
        </section>
      </div>

      <ReviewerDialog reviewer={selectedReviewer} open={open} onOpenChange={setOpen} />
    </main>
  )
}

function FilterPanel({
  tags,
  selectedTags,
  onToggleTag,
  priceRange,
  updatePrice,
  sortOption,
  onSortChange,
}: {
  tags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  priceRange: { min: number; max: number }
  updatePrice: (key: "min" | "max", value: number) => void
  sortOption: SortOption
  onSortChange: (value: SortOption) => void
}) {
  const [minInput, setMinInput] = useState<string>(String(priceRange.min))
  const [maxInput, setMaxInput] = useState<string>(String(priceRange.max))
  const isMinEmpty = minInput === ""
  const isMaxEmpty = maxInput === ""

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setMinInput(value)
    if (value === "") return
    const numeric = Number(value)
    if (!Number.isNaN(numeric)) {
      updatePrice("min", numeric)
    }
  }

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setMaxInput(value)
    if (value === "") return
    const numeric = Number(value)
    if (!Number.isNaN(numeric)) {
      updatePrice("max", numeric)
    }
  }

  return (
    <aside className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl self-start">
      <div>
        <h2 className="text-lg font-semibold text-white">Filters</h2>
        <p className="text-sm text-white/60">Narrow down reviewers to find your perfect fit.</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-white/80">Tags</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isActive = selectedTags.includes(tag)
            return (
              <Toggle
                key={tag}
                pressed={isActive}
                onPressedChange={() => onToggleTag(tag)}
                className={`rounded-full px-4 py-2 text-sm ${
                  isActive ? "bg-[#8B5CF6] text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {tag}
              </Toggle>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-white/80">Price Range</p>
        <div className="flex gap-2">
          <Input
            type="number"
            min={PRICE_RANGE.min}
            max={priceRange.max}
            value={minInput}
            onChange={handleMinChange}
            className={`border-white/20 bg-transparent text-white ${isMinEmpty ? "border-red-500" : ""}`}
          />
          <Input
            type="number"
            min={priceRange.min}
            max={PRICE_RANGE.max}
            value={maxInput}
            onChange={handleMaxChange}
            className={`border-white/20 bg-transparent text-white ${isMaxEmpty ? "border-red-500" : ""}`}
          />
        </div>
        {(isMinEmpty || isMaxEmpty) && (
          <p className="text-xs text-red-400">Both price fields are required.</p>
        )}
        <p className="text-xs text-white/50">
          Global range ${PRICE_RANGE.min} – ${PRICE_RANGE.max}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-white/80">Sort</p>
        <Select value={sortOption} onValueChange={(value) => onSortChange(value as SortOption)}>
          <SelectTrigger className="border-white/20 bg-white/10 text-white">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent className="bg-[#121212] text-white">
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </aside>
  )
}

function ReviewerCard({
  reviewer,
  onSelect,
}: {
  reviewer: Reviewer
  onSelect: (reviewer: Reviewer) => void
}) {
  return (
    <Card
      onClick={() => onSelect(reviewer)}
      className="cursor-pointer border border-white/10 bg-white/5 backdrop-blur-xl transition duration-300 hover:border-[#8B5CF6] hover:shadow-[0_0_30px_rgba(139,92,246,0.35)]"
    >
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="relative h-14 w-14 overflow-hidden rounded-full border border-white/20">
          <Image src={reviewer.avatar} alt={reviewer.name} fill sizes="56px" className="object-cover" />
        </div>
        <div>
          <CardTitle className="flex items-center gap-2 text-white">
            {reviewer.name}
            <span className="inline-flex items-center gap-1 rounded-full bg-[#8B5CF6]/20 px-2 py-1 text-xs font-medium text-[#C4B5FD]">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
          </CardTitle>
          <CardDescription className="text-white/60">Starting at ${reviewer.startingPrice}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {reviewer.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="border border-white/10 bg-white/10 text-white">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-[#FACC15]" />
            <span>{reviewer.rating.toFixed(2)}</span>
            <span className="text-white/50">({reviewer.reviewCount} reviews)</span>
          </div>
          <Button className="bg-[#8B5CF6] text-white hover:bg-[#7C3AED]">View Packages</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PackageCard({ pkg }: { pkg: ReviewerPackage }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        "cursor-pointer rounded-xl border border-white/10 bg-white/5 p-5 transition-all duration-300",
        isExpanded ? "bg-white/10 ring-1 ring-[#8B5CF6]" : "hover:bg-white/10 hover:border-white/20"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-bold text-white">{pkg.title}</h4>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-white/50" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white/50" />
            )}
          </div>
          <p className="text-sm text-white/60 line-clamp-1">{pkg.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#C4B5FD]">${pkg.price}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm text-white/80">{pkg.description}</p>
          
          <div className="flex items-center gap-6 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#8B5CF6]" />
              <span>{pkg.deliveryTime} Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#8B5CF6]" />
              <span>{pkg.revisions} Revision{pkg.revisions !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="space-y-2">
            {(pkg.features || []).map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                <Check className="h-4 w-4 text-[#C4B5FD]" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <Button className="w-full bg-[#8B5CF6] text-white hover:bg-[#7C3AED]">
            Select Package (${pkg.price})
          </Button>
        </div>
      )}
    </div>
  )
}

function ReviewerDialog({
  reviewer,
  open,
  onOpenChange,
}: {
  reviewer: Reviewer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden border border-white/10 bg-[#080808] p-0 text-white sm:h-[85vh]">
        {reviewer ? (
          <div className="flex h-full flex-col">
            {/* Header Section */}
            <div className="relative shrink-0 border-b border-white/10 bg-gradient-to-b from-[#1a1a1a] to-[#080808] p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                  <Image src={reviewer.avatar} alt={reviewer.name} fill sizes="96px" className="object-cover" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <DialogTitle className="text-3xl font-bold md:text-4xl">{reviewer.name}</DialogTitle>
                      {reviewer.verified && (
                        <span className="flex items-center gap-1.5 rounded-full bg-[#8B5CF6]/20 px-3 py-1 text-sm font-semibold text-[#C4B5FD]">
                          <CheckCircle2 className="h-4 w-4" />
                          Verified Pro
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {reviewer.tags.map((tag) => (
                        <Badge key={tag} className="border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] hover:bg-[#8B5CF6]/20">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 rounded-xl border border-white/5 bg-white/5 px-6 py-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-[#FACC15] text-[#FACC15]" />
                      <span className="text-lg font-bold">{reviewer.rating.toFixed(2)}</span>
                      <span className="text-sm text-white/50">({reviewer.reviewCount} Reviews)</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                      <span className="text-sm text-white/50">Starting at</span>
                      <span className="ml-2 text-xl font-bold text-white">${reviewer.startingPrice}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
                <div className="space-y-8">
                  <section>
                    <h3 className="mb-4 text-xl font-bold text-white">About the Reviewer</h3>
                    <p className="leading-relaxed text-white/70">{reviewer.bio}</p>
                  </section>

                  <section>
                    <h3 className="mb-4 text-xl font-bold text-white">Available Packages</h3>
                    <div className="space-y-4">
                      {reviewer.packages.map((pkg) => (
                        <PackageCard key={pkg.title} pkg={pkg} />
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8 lg:border-l lg:border-white/10 lg:pl-8">
                  <section>
                    <h3 className="mb-4 text-lg font-semibold text-white">Why Book {reviewer.name.split(" ")[0]}?</h3>
                    <ul className="space-y-3">
                      <li className="flex gap-3 text-sm text-white/70">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#8B5CF6]" />
                        <span>Verified professional with proven industry experience</span>
                      </li>
                      <li className="flex gap-3 text-sm text-white/70">
                        <Clock className="h-5 w-5 shrink-0 text-[#8B5CF6]" />
                        <span>Fast average response time of under 24 hours</span>
                      </li>
                      <li className="flex gap-3 text-sm text-white/70">
                        <Star className="h-5 w-5 shrink-0 text-[#8B5CF6]" />
                        <span>Consistently rated 5-stars by other artists</span>
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-96 items-center justify-center text-white/60">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
              <p>Loading reviewer details...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
