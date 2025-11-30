"use client"

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Music2, CalendarDays, ExternalLink, PlayCircle } from "lucide-react"
import { PublishedReview } from "@/types/reviews"

type ReviewCardProps = {
  review: PublishedReview
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_-25px_rgba(139,92,246,0.45)] cursor-pointer transition hover:border-[#8B5CF6]/60">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-4">
              <CardTitle className="text-white text-2xl">{review.trackTitle}</CardTitle>
              <Badge className="bg-[#8B5CF6]/20 text-[#C4B5FD] border-[#8B5CF6]/40 flex items-center gap-1">
                <Star className="h-3 w-3 text-[#FACC15]" />
                {review.rating.toFixed(1)}
              </Badge>
            </div>
            <p className="text-sm text-white/70">
              Reviewed by <span className="text-white font-semibold">{review.reviewer}</span> • {review.reviewerTitle}
            </p>
            <p className="text-xs text-white/50 flex items-center justify-center gap-2">
              <Music2 className="h-3.5 w-3.5" />
              Artist: {review.artist}
            </p>
          </CardHeader>

          <CardContent className="space-y-5 text-white/80">
            <div className="text-center">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Summary</h3>
              <p className="text-sm mt-2 line-clamp-3 max-w-2xl mx-auto">{review.summary}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3 text-center max-w-3xl mx-auto">
              <p className="text-sm text-white/60 uppercase tracking-wide">Reviewer Highlight</p>
              <p className="text-white text-sm line-clamp-2">{review.highlight}</p>
              <p className="text-xs text-white/50 flex items-center justify-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(review.postedOn).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-white/60 uppercase tracking-wide mb-2">Scores (16-Card System)</p>
              <div className="grid grid-cols-4 gap-2 max-w-3xl mx-auto">
                {(review.scorecard || []).slice(0, 8).map((item, index) => (
                  <div key={item?.metric || index} className="rounded-xl border border-white/10 bg-black/30 p-2 text-center">
                    <p className="text-[11px] text-white/60 truncate">{item?.metric || 'N/A'}</p>
                    <p className="text-sm font-semibold text-white">{item?.score?.toFixed(1) || '0.0'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="max-w-3xl mx-auto">
              <audio controls preload="none" className="w-full rounded-xl border border-white/10 bg-black/40">
                <source src={review.audioUrl} type="audio/mpeg" />
                Your browser does not support audio playback.
              </audio>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {review.tags.map((tag) => (
                <Badge key={tag} className="border-white/20 bg-white/10 text-white">
                  {tag}
                </Badge>
              ))}
            </div>

            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 max-w-md mx-auto">
              Expand Review
            </Button>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="flex h-[85vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden border border-white/10 bg-[#080808]/95 p-0 text-white sm:max-w-5xl">
        <DialogTitle className="sr-only">{review.trackTitle} Review by {review.reviewer}</DialogTitle>
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white/50 uppercase tracking-wide">Track</p>
                <h2 className="text-3xl font-bold text-white">{review.trackTitle}</h2>
                <p className="text-white/70">Artist • {review.artist}</p>
              </div>
              <Badge className="bg-[#8B5CF6]/20 text-[#C4B5FD] border-[#8B5CF6]/40 flex items-center gap-1 text-base py-2 px-4">
                <Star className="h-4 w-4 text-[#FACC15]" />
                {review.rating.toFixed(1)}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/50">Reviewer</p>
                <p className="text-lg font-semibold text-white">{review.reviewer}</p>
                <p className="text-sm text-white/60">{review.reviewerTitle}</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p className="text-xs uppercase tracking-wide text-white/50">Published</p>
                <p className="text-sm text-white/70">
                  {new Date(review.postedOn).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section className="max-w-4xl mx-auto">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60 text-center">Summary</h3>
              <p className="mt-3 text-white/80 leading-relaxed text-center">{review.summary}</p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-3 max-w-4xl mx-auto">
              <p className="text-sm text-white/60 uppercase tracking-wide text-center">Reviewer Highlight</p>
              <p className="text-white/90 text-base leading-relaxed text-center">{review.highlight}</p>
            </section>

            <section className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-4">Review Scores</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
                {(review.scorecard || []).map((card, index) => (
                  <div
                    key={`${review.id}-${card?.metric || index}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between"
                  >
                    <div className="text-white/70 text-sm pr-3">{card?.metric || 'N/A'}</div>
                    <div className="text-xl font-semibold text-white">{card?.score?.toFixed(1) || '0.0'}</div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
              <section className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-white/60">Reference Audio</p>
                <audio controls className="w-full rounded-2xl border border-white/10 bg-black/40">
                  <source src={review.audioUrl} type="audio/mpeg" />
                </audio>
              </section>

              {review.reviewerMedia && (
                <section className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/60">Reviewer Media</p>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                    <p className="text-white font-semibold flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-[#8B5CF6]" />
                      {review.reviewerMedia.title}
                    </p>
                    <p className="text-sm text-white/70">{review.reviewerMedia.description}</p>
                    {review.reviewerMedia.type === "video" ? (
                      <video controls className="w-full rounded-xl border border-white/10 bg-black/50">
                        <source src={review.reviewerMedia.url} />
                      </video>
                    ) : (
                      <audio controls className="w-full rounded-xl border border-white/10 bg-black/50">
                        <source src={review.reviewerMedia.url} type="audio/mpeg" />
                      </audio>
                    )}
                  </div>
                </section>
              )}
            </div>

            <section className="text-center max-w-3xl mx-auto">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-3">Tags</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {review.tags.map((tag) => (
                  <Badge key={`dialog-${tag}`} className="border-white/20 bg-white/10 text-white">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>
          </div>

          <Button className="bg-[#8B5CF6] text-white hover:bg-[#7C3AED] w-full flex items-center justify-center gap-2">
            View Full Session Notes
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


