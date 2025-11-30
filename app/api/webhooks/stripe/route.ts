import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Extract order_id from metadata
    const orderId = session.metadata?.order_id

    if (!orderId) {
      console.error('No order_id found in session metadata')
      return NextResponse.json(
        { error: 'Missing order_id in metadata' },
        { status: 400 }
      )
    }

    try {
      const supabase = await createClient()

      // Update the order status to 'paid' (or 'open' as per requirements)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)

      if (updateError) {
        console.error('Error updating order status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update order status' },
          { status: 500 }
        )
      }

      console.log(`Order ${orderId} status updated to 'paid'`)
      return NextResponse.json({ received: true, orderId })
    } catch (error: any) {
      console.error('Error processing webhook:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  // Return a response for other event types
  return NextResponse.json({ received: true })
}

