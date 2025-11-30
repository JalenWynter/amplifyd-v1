"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Star, Clock, RefreshCw, Check, Loader2, ArrowLeft } from "lucide-react"
import { getReviewers } from "@/app/actions/reviewers"
import { cn } from "@/lib/utils"

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

interface ReviewerSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trackUrl: string | null
  trackTitle: string | null
}

const ITEMS_PER_PAGE = 6

export function ReviewerSelectionDialog({
  open,
  onOpenChange,
  trackUrl,
  trackTitle,
}: ReviewerSelectionDialogProps) {
  const router = useRouter()
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [loadingReviewers, setLoadingReviewers] = useState(true)
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      async function fetchReviewers() {
        try {
          const data = await getReviewers()
          setReviewers(data)
        } catch (error) {
          console.error("Error fetching reviewers:", error)
        } finally {
          setLoadingReviewers(false)
        }
      }
      fetchReviewers()
      // Reset state when dialog opens
      setSelectedReviewer(null)
      setVisibleCount(ITEMS_PER_PAGE)
    }
  }, [open])

  const handleBookNow = (reviewerId: string, packageId: string) => {
    if (!trackUrl || !trackTitle) return
    
    const params = new URLSearchParams({
      reviewerId,
      packageId,
      trackUrl,
      trackTitle,
    })
    router.push(`/checkout?${params.toString()}`)
  }

  // Infinite scroll handler
  const handleLoadMore = useCallback(() => {
    if (loadingReviewers) return
    setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, reviewers.length))
  }, [loadingReviewers, reviewers.length])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && visibleCount < reviewers.length && !loadingReviewers) {
          handleLoadMore()
        }
      },
      { rootMargin: "100px" }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [visibleCount, reviewers.length, loadingReviewers, handleLoadMore])

  const visibleReviewers = reviewers.slice(0, visibleCount)
  const hasMore = visibleCount < reviewers.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] md:max-w-6xl lg:max-w-7xl h-[100dvh] md:h-[90vh] max-h-[100dvh] md:max-h-[90vh] overflow-hidden border border-white/10 bg-[#080808]/90 backdrop-blur-md text-white p-0 flex flex-col m-0 md:m-4">
        {selectedReviewer ? (
          <DetailView
            reviewer={selectedReviewer}
            onBack={() => setSelectedReviewer(null)}
            onBookNow={handleBookNow}
          />
        ) : (
          <ListView
            reviewers={visibleReviewers}
            loadingReviewers={loadingReviewers}
            hasMore={hasMore}
            onSelectReviewer={setSelectedReviewer}
            loadMoreRef={loadMoreRef}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ListView({
  reviewers,
  loadingReviewers,
  hasMore,
  onSelectReviewer,
  loadMoreRef,
}: {
  reviewers: Reviewer[]
  loadingReviewers: boolean
  hasMore: boolean
  onSelectReviewer: (reviewer: Reviewer) => void
  loadMoreRef: React.RefObject<HTMLDivElement>
}) {
  return (
    <>
      <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-white/10 shrink-0">
        <DialogTitle className="text-2xl md:text-3xl font-bold text-white">Select Your Reviewer</DialogTitle>
        <DialogDescription className="text-white/60 text-sm md:text-base">
          Choose a professional reviewer to review your track
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        {loadingReviewers && reviewers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : reviewers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/50">No reviewers available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {reviewers.map((reviewer) => (
              <CompactReviewerCard
                key={reviewer.id}
                reviewer={reviewer}
                onClick={() => onSelectReviewer(reviewer)}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-6">
            {loadingReviewers && reviewers.length > 0 && (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            )}
          </div>
        )}
      </div>
    </>
  )
}

function CompactReviewerCard({
  reviewer,
  onClick,
}: {
  reviewer: Reviewer
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl transition duration-300 hover:border-[#8B5CF6] hover:shadow-[0_0_20px_rgba(139,92,246,0.25)] p-4 space-y-3 h-full flex flex-col min-h-[140px]"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/20">
          <Image src={reviewer.avatar} alt={reviewer.name} fill sizes="48px" className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate text-sm md:text-base">{reviewer.name}</h3>
            {reviewer.verified && (
              <CheckCircle2 className="h-4 w-4 text-[#8B5CF6] shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <Star className="h-3.5 w-3.5 text-[#FACC15] shrink-0" />
            <span className="text-white">{reviewer.rating.toFixed(2)}</span>
            <span className="text-white/50">({reviewer.reviewCount})</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base md:text-lg font-bold text-[#C4B5FD]">${reviewer.startingPrice}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {reviewer.tags.slice(0, 2).map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="border border-white/10 bg-white/10 text-white text-xs px-2 py-0.5"
          >
            {tag}
          </Badge>
        ))}
        {reviewer.tags.length > 2 && (
          <Badge
            variant="secondary"
            className="border border-white/10 bg-white/10 text-white/60 text-xs px-2 py-0.5"
          >
            +{reviewer.tags.length - 2}
          </Badge>
        )}
      </div>
    </div>
  )
}

function DetailView({
  reviewer,
  onBack,
  onBookNow,
}: {
  reviewer: Reviewer
  onBack: () => void
  onBookNow: (reviewerId: string, packageId: string) => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#080808]/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4 px-6 py-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20">
              <Image src={reviewer.avatar} alt={reviewer.name} fill sizes="40px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{reviewer.name}</h2>
              {reviewer.verified && (
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3 text-[#8B5CF6]" />
                  <span className="text-xs text-white/60">Verified Pro</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Bio Section */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">About</h3>
          <p className="text-white/70 leading-relaxed">{reviewer.bio || "No bio available."}</p>
        </section>

        {/* Tags Section */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {reviewer.tags.map((tag) => (
              <Badge
                key={tag}
                className="border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] px-3 py-1"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </section>

        {/* Rating Section */}
        <section>
          <div className="flex items-center gap-6 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-[#FACC15] text-[#FACC15]" />
              <span className="text-lg font-bold text-white">{reviewer.rating.toFixed(2)}</span>
              <span className="text-sm text-white/50">({reviewer.reviewCount} Reviews)</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <span className="text-sm text-white/50">Starting at</span>
              <span className="ml-2 text-xl font-bold text-white">${reviewer.startingPrice}</span>
            </div>
          </div>
        </section>

        {/* Packages Section */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-4">Available Packages</h3>
          {reviewer.packages.length === 0 ? (
            <p className="text-white/50">No packages available.</p>
          ) : (
            <div className="space-y-4">
              {reviewer.packages.map((pkg) => (
                <PackageCard
                  key={pkg.id || pkg.title}
                  pkg={pkg}
                  reviewerId={reviewer.id}
                  onBookNow={onBookNow}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function PackageCard({
  pkg,
  reviewerId,
  onBookNow,
}: {
  pkg: ReviewerPackage
  reviewerId: string
  onBookNow: (reviewerId: string, packageId: string) => void
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 space-y-3 md:space-y-4 w-full">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-base md:text-lg font-bold text-white mb-1">{pkg.title}</h4>
          <p className="text-xs md:text-sm text-white/70 line-clamp-2">{pkg.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl md:text-2xl font-bold text-[#C4B5FD]">${pkg.price}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm text-white/70 flex-wrap">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#8B5CF6]" />
          <span>{pkg.deliveryTime} Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#8B5CF6]" />
          <span>{pkg.revisions} Revision{pkg.revisions !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {pkg.features && pkg.features.length > 0 && (
        <div className="space-y-1.5 md:space-y-2 pt-2 border-t border-white/10">
          {pkg.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-xs md:text-sm text-white/80">
              <Check className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#C4B5FD] shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={() => onBookNow(reviewerId, pkg.id)}
        className="w-full bg-[#8B5CF6] text-white hover:bg-[#7C3AED] mt-2 text-sm md:text-base"
      >
        Book Now (${pkg.price})
      </Button>
    </div>
  )
}
