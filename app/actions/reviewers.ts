'use server'

import { createClient } from '@/utils/supabase/server'

export async function getReviewers() {
  const supabase = await createClient()

  // Fetch all profiles where role is 'reviewer'
  const { data: reviewers, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio, pricing_packages, tags, verified, rating, review_count')
    .eq('role', 'reviewer')

  if (error) {
    console.error('Error fetching reviewers:', error)
    return []
  }

  if (!reviewers) return []

  // Transform the data to match the Reviewer type
  return reviewers.map((reviewer: any) => {
    const pricingPackages = reviewer.pricing_packages || []
    const packages = Array.isArray(pricingPackages) ? pricingPackages : []
    
    // Calculate starting price (minimum price from packages)
    const startingPrice = packages.length > 0
      ? Math.min(...packages.map((pkg: any) => pkg.price || Infinity))
      : 0

    return {
      id: reviewer.id,
      name: reviewer.full_name || 'Unknown Reviewer',
      avatar: reviewer.avatar_url || '/placeholder-user.jpg',
      verified: reviewer.verified || false,
      tags: reviewer.tags || [],
      rating: reviewer.rating || 0,
      reviewCount: reviewer.review_count || 0,
      startingPrice: startingPrice === Infinity ? 0 : startingPrice,
      bio: reviewer.bio || '',
      packages: packages.map((pkg: any) => ({
        id: pkg.id,
        title: pkg.title || pkg.name || 'Package',
        price: pkg.price || 0,
        description: pkg.description || '',
        deliveryTime: pkg.deliveryTime || pkg.delivery_time || 'N/A',
        revisions: pkg.revisions || 0,
        features: pkg.features || [],
      })),
    }
  })
}

