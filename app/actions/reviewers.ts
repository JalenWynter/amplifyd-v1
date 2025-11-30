'use server'

import { createClient } from '@/utils/supabase/server'

export type Reviewer = {
  id: string
  name: string
  avatar: string
  verified: boolean
  tags: string[]
  rating: number
  reviewCount: number
  startingPrice: number
  bio: string
  packages: any[]
}

export async function getReviewers() {
  console.log('Fetching reviewers...')
  const supabase = await createClient()

  // 1. Fetch profiles with the correct column names
  // We explicitly ask for 'is_verified' instead of 'verified'
  const { data: reviewers, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio, pricing_packages, tags, is_verified, rating, review_count')
    .eq('role', 'reviewer')

  console.log('Supabase response:', { data: reviewers, error })

  if (error) {
    console.error('Supabase Error fetching reviewers:', error.message)
    console.error('Full error object:', error)
    return []
  }

  if (!reviewers || reviewers.length === 0) {
    console.log('No reviewers found matching criteria.')
    return []
  }

  // 2. Transform the data safely
  console.log(`Transforming ${reviewers.length} reviewer(s)...`)
  const transformed = reviewers.map((reviewer: any) => {
    // Safe parse packages
    const pricingPackages = reviewer.pricing_packages || []
    const packages = Array.isArray(pricingPackages) ? pricingPackages : []
    
    // Safe parse tags (handle if it's stored as a string or an array)
    let tags: string[] = []
    if (reviewer.tags) {
      if (Array.isArray(reviewer.tags)) {
        tags = reviewer.tags
      } else if (typeof reviewer.tags === 'string') {
        try {
          tags = JSON.parse(reviewer.tags)
        } catch {
          tags = [reviewer.tags]
        }
      }
    }
    
    // Calculate starting price safely
    const startingPrice = packages.length > 0
      ? Math.min(...packages.map((pkg: any) => Number(pkg.price) || Infinity))
      : 0

    return {
      id: reviewer.id,
      name: reviewer.full_name || 'Unknown Reviewer',
      avatar: reviewer.avatar_url || '/placeholder-user.jpg',
      verified: reviewer.is_verified || false, // Mapping is_verified -> verified
      tags: tags,
      rating: Number(reviewer.rating) || 0,
      reviewCount: Number(reviewer.review_count) || 0,
      startingPrice: startingPrice === Infinity ? 0 : startingPrice,
      bio: reviewer.bio || '',
      packages: packages
    }
  })
  
  console.log(`Successfully transformed ${transformed.length} reviewer(s)`)
  return transformed
}