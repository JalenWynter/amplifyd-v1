'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

/**
 * RealtimeOrdersListener Component
 * 
 * Listens for real-time changes to the orders table and triggers
 * a router refresh to update Server Components with the latest data.
 * 
 * Architecture:
 * - Server Components: Fetch data securely on first load (fast, SEO-friendly)
 * - Client Listener: Detects changes and nudges server to refetch (real-time feel)
 * 
 * This keeps the app fast and SEO-friendly while providing real-time updates.
 */
export function RealtimeOrdersListener() {
  const router = useRouter()

  useEffect(() => {
    // Create Supabase client for real-time subscriptions
    const supabase = createClient()

    // Create a channel for listening to orders table changes
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('[RealtimeOrdersListener] Order change detected:', {
            eventType: payload.eventType,
            orderId: payload.new?.id || payload.old?.id,
            status: payload.new?.status || payload.old?.status,
          })

          // Trigger a refresh of Server Components
          // This will cause Next.js to re-fetch data from Server Components
          // without a full page reload (maintains client state)
          router.refresh()
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeOrdersListener] Subscription status:', status)
      })

    // Cleanup: Unsubscribe when component unmounts
    return () => {
      console.log('[RealtimeOrdersListener] Unsubscribing from orders channel')
      supabase.removeChannel(channel)
    }
  }, [router])

  // This component renders nothing - it's just a listener
  return null
}

