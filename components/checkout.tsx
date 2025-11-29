"use client"

import { useCallback } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

import { startCheckoutSession } from "@/app/actions/stripe"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function Checkout({ 
  reviewerId, 
  packageId, 
  fileUrl, 
  fileTitle 
}: { 
  reviewerId: string
  packageId: string
  fileUrl: string
  fileTitle: string
}) {
  const fetchClientSecret = useCallback(async () => {
    const result = await startCheckoutSession(reviewerId, packageId, fileUrl, fileTitle)
    return result.clientSecret || null
  }, [reviewerId, packageId, fileUrl, fileTitle])

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
