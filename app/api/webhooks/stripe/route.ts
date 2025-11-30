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

  // Log all webhook events for debugging
  console.log(`[Stripe Webhook] Received event: ${event.type}`, {
    eventId: event.id,
    livemode: event.livemode,
    created: new Date(event.created * 1000).toISOString(),
  })

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    console.log(`[Stripe Webhook] Processing checkout.session.completed`, {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      metadata: session.metadata,
    })

    // Only update if payment is actually paid
    if (session.payment_status !== 'paid') {
      console.log(`[Stripe Webhook] Payment not completed. Status: ${session.payment_status}`)
      return NextResponse.json({ 
        received: true, 
        message: `Payment status is ${session.payment_status}, not updating order` 
      })
    }

    // Extract order_id from metadata
    const orderId = session.metadata?.order_id

    if (!orderId) {
      console.error('[Stripe Webhook] No order_id found in session metadata', {
        sessionId: session.id,
        metadata: session.metadata,
      })
      return NextResponse.json(
        { error: 'Missing order_id in metadata' },
        { status: 400 }
      )
    }

    try {
      const supabase = await createClient()

      // Verify order exists and get current status
      const { data: existingOrder, error: fetchError } = await supabase
        .from('orders')
        .select('id, status, stripe_session_id')
        .eq('id', orderId)
        .single()

      if (fetchError || !existingOrder) {
        console.error('[Stripe Webhook] Order not found:', fetchError)
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      // Only update if order is still pending (avoid duplicate updates)
      if (existingOrder.status === 'paid' || existingOrder.status === 'completed') {
        console.log(`[Stripe Webhook] Order ${orderId} already has status: ${existingOrder.status}`)
        return NextResponse.json({ 
          received: true, 
          message: `Order already ${existingOrder.status}` 
        })
      }

      // Update the order status to 'paid' only after webhook confirmation
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          // Ensure stripe_session_id is set if not already
          stripe_session_id: existingOrder.stripe_session_id || session.id,
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('[Stripe Webhook] Error updating order status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update order status' },
          { status: 500 }
        )
      }

      console.log(`[Stripe Webhook] Successfully updated order ${orderId} status to 'paid'`)
      return NextResponse.json({ 
        received: true, 
        orderId,
        message: 'Order status updated to paid' 
      })
    } catch (error: any) {
      console.error('[Stripe Webhook] Error processing webhook:', error)
      return NextResponse.json(
        { error: 'Internal server error', details: error.message },
        { status: 500 }
      )
    }
  }

  // Handle payment_intent.succeeded as a backup
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    
    console.log(`[Stripe Webhook] Processing payment_intent.succeeded`, {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
    })

    // Try to find order by payment intent ID or metadata
    const orderId = paymentIntent.metadata?.order_id

    if (orderId) {
      try {
        const supabase = await createClient()
        
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id, status')
          .eq('id', orderId)
          .single()

        if (existingOrder && existingOrder.status === 'pending') {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', orderId)

          if (!updateError) {
            console.log(`[Stripe Webhook] Updated order ${orderId} via payment_intent.succeeded`)
          }
        }
      } catch (error: any) {
        console.error('[Stripe Webhook] Error processing payment_intent.succeeded:', error)
      }
    }
  }

  // Return a response for other event types
  return NextResponse.json({ 
    received: true, 
    eventType: event.type,
    message: `Event ${event.type} received but not processed` 
  })
}

