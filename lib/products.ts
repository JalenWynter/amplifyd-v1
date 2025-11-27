export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
  recommended?: boolean
}

// Source of truth for all pricing plans
export const PRODUCTS: Product[] = [
  {
    id: "starter-pack",
    name: "Starter",
    description: "Perfect for trying out our mastering service",
    priceInCents: 1499, // $14.99
    features: ["1 track mastered", "Professional audio processing", "WAV & MP3 delivery", "48-hour turnaround"],
  },
  {
    id: "pro-pack",
    name: "Pro",
    description: "Best value for serious artists",
    priceInCents: 3999, // $39.99
    recommended: true,
    features: [
      "5 tracks mastered",
      "Priority processing",
      "Advanced audio enhancement",
      "WAV, MP3 & FLAC delivery",
      "24-hour turnaround",
      "Unlimited revisions",
    ],
  },
  {
    id: "studio-pack",
    name: "Studio",
    description: "Professional studio-grade mastering",
    priceInCents: 9999, // $99.99
    features: [
      "15 tracks mastered",
      "VIP priority queue",
      "Dedicated mastering engineer",
      "All formats including DDP",
      "12-hour turnaround",
      "Unlimited revisions",
      "Stem mastering available",
    ],
  },
]

export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`
}
