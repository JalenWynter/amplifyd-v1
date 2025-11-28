export type PublishedReview = {
  id: string
  reviewer: string
  reviewerTitle: string
  artist: string
  trackTitle: string
  audioUrl: string
  summary: string
  highlight: string
  rating: number
  postedOn: string
  tags: string[]
  scorecard: {
    metric: string
    score: number
  }[]
  reviewerMedia?: {
    type: "audio" | "video"
    url: string
    title: string
    description?: string
  }
}


