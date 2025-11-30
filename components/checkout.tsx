"use client"

import { useEffect, useRef } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function Checkout({ 
  clientSecret,
  onPaymentSuccess,
  orderId
}: { 
  clientSecret: string
  onPaymentSuccess?: () => void
  orderId?: string | null
}) {
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    if (!onPaymentSuccess || !orderId) return

    // Poll for order status change (webhook updates it to 'paid')
    const pollOrderStatus = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`)
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'paid' && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true
            onPaymentSuccess()
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
            }
          }
        }
      } catch (error) {
        console.error('Error polling order status:', error)
      }
    }

    // Start polling after 2 seconds, then every 2 seconds
    const timeout = setTimeout(() => {
      pollOrderStatus()
      pollIntervalRef.current = setInterval(pollOrderStatus, 2000)
    }, 2000)

    // Also listen for postMessage from Stripe iframe
    const handleMessage = (event: MessageEvent) => {
      // Stripe sends completion events
      if (event.origin.includes('stripe') || event.data?.type === 'checkout.session.completed') {
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true
          onPaymentSuccess()
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      clearTimeout(timeout)
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      window.removeEventListener('message', handleMessage)
    }
  }, [onPaymentSuccess, orderId])

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider 
        stripe={stripePromise} 
        options={{ clientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
