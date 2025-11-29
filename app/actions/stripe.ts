"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/utils/supabase/server"

export async function startCheckoutSession(
  reviewerId: string,
  packageId: string,
  fileUrl: string,
  fileTitle: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch reviewer profile with pricing_packages
  const { data: reviewerProfile, error: reviewerError } = await supabase
    .from('profiles')
    .select('pricing_packages, full_name, email')
    .eq('id', reviewerId)
    .single()

  if (reviewerError || !reviewerProfile) {
    throw new Error(`Reviewer not found: ${reviewerError?.message || 'Unknown error'}`)
  }

  // Parse pricing_packages JSON and find the specific package
  const reviewerData = reviewerProfile as any
  const pricingPackages = reviewerData.pricing_packages as any[]
  if (!Array.isArray(pricingPackages)) {
    throw new Error('Invalid pricing packages format')
  }

  const selectedPackage = pricingPackages.find((pkg: any) => pkg.id === packageId)
  if (!selectedPackage) {
    throw new Error(`Package with id "${packageId}" not found for this reviewer`)
  }

  // Create order in database before Stripe session
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      artist_id: user?.id || null,
      reviewer_id: reviewerId,
      track_url: fileUrl,
      track_title: fileTitle,
      selected_package_id: packageId,
      price_total: selectedPackage.price,
      platform_fee: Math.floor(selectedPackage.price * 0.1), // 10% platform fee
      status: 'pending'
    } as any)
    .select()
    .single()

  if (orderError || !order) {
    throw new Error(`Failed to create order: ${orderError?.message || 'Unknown error'}`)
  }

  const orderData = order as { id: string; [key: string]: any }

  // Create Stripe Checkout Session with real data
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: selectedPackage.title || selectedPackage.name,
            description: selectedPackage.description || '',
          },
          unit_amount: Math.round(selectedPackage.price * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      order_id: orderData.id,
      reviewer_id: reviewerId,
      package_id: packageId,
    },
  })

  return {
    clientSecret: session.client_secret,
    orderId: orderData.id,
  }
}
