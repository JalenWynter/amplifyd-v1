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
  Search,
  X,
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
import { getReviewers } from "@/app/actions/reviewers"
import { useRouter } from "next/navigation"

type ReviewerPackage = {
  id: string
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

// TAG_OPTIONS and PRICE_RANGE will be calculated from fetched data

type SortOption = "rating" | "price-asc" | "price-desc" | "reviews"

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Highest Rated", value: "rating" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Review Count", value: "reviews" },
]

function useReviewerFilters(reviewers: Reviewer[]) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Calculate price range from reviewers
  const calculatedPriceRange = useMemo(() => {
    if (reviewers.length === 0) {
      return { min: 0, max: 1000 }
    }
    const prices = reviewers.map((r) => r.startingPrice).filter((p) => p > 0)
    if (prices.length === 0) {
      return { min: 0, max: 1000 }
    }
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }
  }, [reviewers])

  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>(calculatedPriceRange)
  const [sortOption, setSortOption] = useState<SortOption>("rating")

  // Update price range when reviewers change
  useEffect(() => {
    setPriceRange(calculatedPriceRange)
  }, [calculatedPriceRange])

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
  const router = useRouter()
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null)
  const [open, setOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [loadingReviewers, setLoadingReviewers] = useState(true)
  const [tagOptions, setTagOptions] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 })

  const {
    filteredReviewers,
    selectedTags,
    toggleTag,
    priceRange: filterPriceRange,
    updatePrice,
    sortOption,
    setSortOption,
  } = useReviewerFilters(reviewers)
  const { visibleReviewers, loadMoreRef, isLoading, hasMore } = useInfiniteReviewers(filteredReviewers)

  // Fetch reviewers from Supabase
  useEffect(() => {
    async function fetchReviewers() {
      try {
        const data = await getReviewers()
        setReviewers(data)
        
        // Calculate tag options from fetched data
        const allTags = Array.from(new Set(data.flatMap((reviewer) => reviewer.tags))).sort()
        setTagOptions(allTags)
        
        // Calculate price range from fetched data
        if (data.length > 0) {
          const prices = data.map((r) => r.startingPrice).filter((p) => p > 0)
          if (prices.length > 0) {
            setPriceRange({
              min: Math.min(...prices),
              max: Math.max(...prices),
            })
          }
        }
      } catch (error) {
        console.error('Error fetching reviewers:', error)
      } finally {
        setLoadingReviewers(false)
      }
    }

    fetchReviewers()
  }, [])

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
            <Link href="/reviews" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              Reviews
            </Link>
            <Link href="/about" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              About
            </Link>
            <Link href="/support" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              Contact
            </Link>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <NavbarAuth isAuthenticated={isAuthenticated} />
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <FilterPanel
            tags={tagOptions}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            priceRange={filterPriceRange}
            updatePrice={updatePrice}
            sortOption={sortOption}
            onSortChange={setSortOption}
            globalPriceRange={priceRange}
          />

          <div className="space-y-6">
            <div className="space-y-4 text-center mb-8">
              <Badge className="border border-white/20 bg-white/10 text-white">Amplifyd Marketplace</Badge>
              <h1 className="text-4xl font-bold text-white md:text-5xl">Find Your Professional</h1>
              <p className="text-lg text-white/70">
                Browse vetted reviewers who specialize in elevating your sound with precise critique and actionable direction.
              </p>
            </div>

            {loadingReviewers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            ) : (
              <>
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

                {visibleReviewers.length === 0 && !loadingReviewers && (
                  <div className="text-center py-12">
                    <p className="text-white/50">No reviewers found matching your filters.</p>
                  </div>
                )}

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
              </>
            )}
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
  globalPriceRange,
}: {
  tags: string[]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  priceRange: { min: number; max: number }
  updatePrice: (key: "min" | "max", value: number) => void
  sortOption: SortOption
  onSortChange: (value: SortOption) => void
  globalPriceRange: { min: number; max: number }
}) {
  const [minInput, setMinInput] = useState<string>(String(priceRange.min))
  const [maxInput, setMaxInput] = useState<string>(String(priceRange.max))
  const [tagSearch, setTagSearch] = useState<string>("")
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isMinEmpty = minInput === ""
  const isMaxEmpty = maxInput === ""

  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return tags
    const searchLower = tagSearch.toLowerCase()
    return tags.filter((tag) => tag.toLowerCase().includes(searchLower))
  }, [tags, tagSearch])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for tags..."
              value={tagSearch}
              onChange={(e) => {
                setTagSearch(e.target.value)
                setIsDropdownOpen(true)
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="border-white/20 bg-transparent pl-10 pr-10 text-white placeholder:text-white/40"
            />
            {tagSearch && (
              <button
                onClick={() => {
                  setTagSearch("")
                  setIsDropdownOpen(false)
                  searchInputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {isDropdownOpen && filteredTags.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-white/10 bg-[#121212] shadow-lg"
            >
              {filteredTags.map((tag) => {
                const isSelected = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      onToggleTag(tag)
                      setTagSearch("")
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-[#8B5CF6]/20 text-[#C4B5FD]"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{tag}</span>
                      {isSelected && <Check className="h-4 w-4" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          {isDropdownOpen && filteredTags.length === 0 && tagSearch.trim() && (
            <div
              ref={dropdownRef}
              className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#121212] p-4 text-center text-sm text-white/50"
            >
              No tags found
            </div>
          )}
        </div>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                className="flex items-center gap-1.5 border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-2.5 py-1 text-xs text-[#C4B5FD]"
              >
                {tag}
                <button
                  onClick={() => onToggleTag(tag)}
                  className="ml-0.5 rounded-full hover:bg-[#8B5CF6]/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-white/80">Price Range</p>
        <div className="flex gap-2">
          <Input
            type="number"
            min={globalPriceRange.min}
            max={priceRange.max}
            value={minInput}
            onChange={handleMinChange}
            className={`border-white/20 bg-transparent text-white ${isMinEmpty ? "border-red-500" : ""}`}
          />
          <Input
            type="number"
            min={priceRange.min}
            max={globalPriceRange.max}
            value={maxInput}
            onChange={handleMaxChange}
            className={`border-white/20 bg-transparent text-white ${isMaxEmpty ? "border-red-500" : ""}`}
          />
        </div>
        {(isMinEmpty || isMaxEmpty) && (
          <p className="text-xs text-red-400">Both price fields are required.</p>
        )}
        <p className="text-xs text-white/50">
          Global range ${globalPriceRange.min} – ${globalPriceRange.max}
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

function PackageCard({ pkg, reviewerId }: { pkg: ReviewerPackage; reviewerId: string }) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card expansion when clicking button
    router.push(`/checkout?reviewerId=${reviewerId}&packageId=${pkg.id}`)
  }

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

          <Button 
            onClick={handleBookNow}
            className="w-full bg-[#8B5CF6] text-white hover:bg-[#7C3AED]"
          >
            Book Now (${pkg.price})
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
      <DialogContent className="flex h-[85vh] w-[90vw] max-w-[1400px] flex-col gap-0 overflow-hidden border border-white/10 bg-[#080808]/90 backdrop-blur-md p-0 text-white sm:max-w-[1400px]">
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
              <div className="grid gap-12 xl:grid-cols-[1fr_400px]">
                <div className="space-y-8">
                  <section>
                    <h3 className="mb-4 text-xl font-bold text-white">About the Reviewer</h3>
                    <p className="leading-relaxed text-white/70">{reviewer.bio}</p>
                  </section>

                  <section>
                    <h3 className="mb-4 text-xl font-bold text-white">Available Packages</h3>
                    <div className="space-y-4">
                      {reviewer.packages.map((pkg) => (
                        <PackageCard key={pkg.id || pkg.title} pkg={pkg} reviewerId={reviewer.id} />
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8 xl:border-l xl:border-white/10 xl:pl-8">
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
