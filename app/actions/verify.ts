'use server'

import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'

/**
 * Verify payment status directly from Stripe
 * This provides redundancy when webhooks fail
 * 
 * @param orderId - The order ID to verify
 * @returns Success status and any error messages
 */
export async function verifyPaymentStatus(orderId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get the order from Supabase
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { success: false, error: 'Order not found' }
  }

  // Verify user owns this order
  if (order.artist_id !== user.id) {
    return { success: false, error: 'Unauthorized - order does not belong to user' }
  }

  // If no stripe_session_id, return error
  if (!order.stripe_session_id) {
    return { 
      success: false, 
      error: 'Cannot verify - no Stripe session ID stored for this order' 
    }
  }

  try {
    // Call stripe.checkout.sessions.retrieve(stripe_session_id)
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)

    // If payment_status === 'paid', update orders status to 'paid'
    if (session.payment_status === 'paid') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)

      if (updateError) {
        console.error('Error updating order status:', updateError)
        return { success: false, error: 'Failed to update order status in database' }
      }

      // Revalidate the dashboard path
      revalidatePath('/dashboard/artist')
      revalidatePath('/dashboard/artist/tracks')

      return { success: true }
    } else {
      // Payment not completed yet
      return { 
        success: false, 
        error: `Payment status: ${session.payment_status}. Payment has not been completed.` 
      }
    }
  } catch (error: any) {
    console.error('Error verifying payment with Stripe:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to verify payment with Stripe API' 
    }
  }
}

