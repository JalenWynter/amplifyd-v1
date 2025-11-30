"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/utils/supabase/server"
import { createOrder } from "./orders"

export async function startCheckoutSession(
  reviewerId: string,
  packageId: string,
  trackUrl: string,
  trackTitle: string
) {
  const supabase = await createClient()

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

  // Create order in database before Stripe session using createOrder action
  const order = await createOrder({
    reviewerId,
    packageId,
    trackUrl,
    trackTitle,
    priceTotal: selectedPackage.price,
  })

  const orderData = order as { id: string; [key: string]: any }

  // Create Stripe Checkout Session with real price from package
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
