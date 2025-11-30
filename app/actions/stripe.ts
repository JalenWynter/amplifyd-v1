"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/utils/supabase/server"
import { createOrder } from "./orders"
import { validatePromoCode, applyPromoCode } from "./promo-codes"

export async function startCheckoutSession(
  reviewerId: string,
  packageId: string,
  trackUrl: string,
  trackTitle: string,
  note?: string,
  promoCode?: string
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

  // Calculate final price with promo code discount
  let finalPrice = selectedPackage.price
  let discountAmount = 0

  if (promoCode) {
    const validation = await validatePromoCode(promoCode)
    if (validation.valid && validation.discount) {
      if (validation.discount.type === 'percentage') {
        discountAmount = (selectedPackage.price * validation.discount.value) / 100
      } else {
        discountAmount = validation.discount.value
      }
      discountAmount = Math.min(discountAmount, selectedPackage.price)
      finalPrice = selectedPackage.price - discountAmount
    }
  }

  // Create order in database before Stripe session using createOrder action
  const order = await createOrder({
    reviewerId,
    packageId,
    trackUrl,
    trackTitle,
    priceTotal: finalPrice,
    note,
  })

  const orderData = order as { id: string; [key: string]: any }

  // Apply promo code to order if valid
  if (promoCode && discountAmount > 0) {
    await applyPromoCode(promoCode, orderData.id, selectedPackage.price)
  }

  // Create Stripe Checkout Session with discounted price
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
          unit_amount: Math.round(finalPrice * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    payment_method_types: ["card", "link"],
    payment_method_options: {
      card: {
        request_three_d_secure: "automatic",
      },
    },
    metadata: {
      order_id: orderData.id,
      reviewer_id: reviewerId,
      package_id: packageId,
      promo_code: promoCode || '',
    },
  })

  // Update order with Stripe session ID for payment verification redundancy
  const { error: updateError } = await supabase
    .from('orders')
    .update({ stripe_session_id: session.id })
    .eq('id', orderData.id)

  if (updateError) {
    console.error('Error updating order with Stripe session ID:', updateError)
    // Don't throw - session ID storage is for redundancy, not critical for checkout
  }

  return {
    clientSecret: session.client_secret || null,
    orderId: orderData.id,
  }
}
