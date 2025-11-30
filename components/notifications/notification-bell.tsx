'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Bell, X, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getUnreadNotifications, markAsRead, markAllAsRead, deleteNotification, Notification, NotificationType } from '@/app/actions/notifications'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const router = useRouter()
  const { toast } = useToast()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null)

  // Fetch initial notifications
  useEffect(() => {
    async function loadNotifications() {
      try {
        const unread = await getUnreadNotifications()
        setNotifications(unread)
        setUnreadCount(unread.length)
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let isMounted = true

    // Get current user ID for filtering
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !isMounted) return

      // Create a channel for listening to notifications table changes
      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return
            const newNotification = payload.new as Notification
            
            // Add to notifications list
            setNotifications((prev) => [newNotification, ...prev])
            
            // Increment unread count
            setUnreadCount((prev) => prev + 1)

            // Show toast
            toast({
              title: 'New Notification!',
              description: newNotification.title,
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return
            const updatedNotification = payload.new as Notification
            
            // Update notification in list if it was marked as read
            if (updatedNotification.is_read) {
              setNotifications((prev) =>
                prev.filter((n) => n.id !== updatedNotification.id)
              )
              setUnreadCount((prev) => Math.max(0, prev - 1))
            }
          }
        )
        .subscribe((status) => {
          console.log('[NotificationBell] Subscription status:', status)
        })
    })

    // Cleanup: Unsubscribe when component unmounts
    return () => {
      isMounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [toast])

  // Get default route based on notification type and user role
  const getDefaultRoute = async (type: NotificationType): Promise<string> => {
    // Get user's role to determine correct settings page
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const role = (profile as any)?.role
      
      // Route based on notification type first, then fallback to user role
      switch (type) {
        case 'payment':
          return '/dashboard/reviewer'
        case 'review':
          return '/dashboard/artist'
        case 'order':
          return '/dashboard/artist'
        case 'system':
        default:
          // For system notifications (like welcome), route to settings based on role
          if (role === 'reviewer') {
            return '/dashboard/reviewer/settings'
          } else if (role === 'artist') {
            return '/dashboard/settings'
          } else if (role === 'admin') {
            return '/dashboard/admin'
          }
          return '/dashboard/settings' // Default fallback
      }
    }
    
    return '/dashboard/settings'
  }

  // Validate if a URL is a valid internal route
  const isValidInternalRoute = (url: string | null): boolean => {
    if (!url) return false
    
    // Check if it's a relative path (starts with /)
    if (!url.startsWith('/')) return false
    
    // List of valid base routes - allow any path under these
    const validBaseRoutes = [
      '/dashboard',
      '/marketplace',
      '/reviews',
      '/support',
      '/about',
      '/orders',
      '/checkout',
    ]
    
    // Check if it matches or starts with a valid base route
    return validBaseRoutes.some(route => url === route || url.startsWith(route + '/'))
  }

  const handleNotificationClick = async (notification: Notification, e?: React.MouseEvent) => {
    // Prevent navigation if clicking the delete button
    if (e && (e.target as HTMLElement).closest('button[data-delete]')) {
      return
    }

    // Mark as read immediately (removes from unread count, but keeps in list)
    if (!notification.is_read) {
      await markAsRead(notification.id)
      // Update the notification in state to mark it as read (but don't remove it)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    // Toggle expanded state
    if (expandedNotification === notification.id) {
      // If already expanded, navigate to the route
      setExpandedNotification(null)
      setIsOpen(false)
      
      // Determine route: use link_url if valid, otherwise use default route based on type
      let route: string
      if (notification.link_url && isValidInternalRoute(notification.link_url)) {
        route = notification.link_url
      } else {
        route = await getDefaultRoute(notification.type)
      }

      // Navigate to the route
      router.push(route)
    } else {
      // Expand to show full message
      setExpandedNotification(notification.id)
    }
  }

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    await deleteNotification(notificationId)
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    
    toast({
      title: 'Notification removed',
      description: 'The notification has been deleted.',
    })
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    setNotifications([])
    setUnreadCount(0)
    
    toast({
      title: 'All notifications marked as read',
      description: 'All notifications have been cleared.',
    })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-sm font-semibold hover:text-primary transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#8B5CF6] text-white text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-7 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications.
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const isExpanded = expandedNotification === notification.id
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "w-full relative group transition-all",
                      isExpanded && "bg-muted/30"
                    )}
                  >
                    <div
                      onClick={(e) => handleNotificationClick(notification, e)}
                      className="w-full p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{notification.title}</p>
                            {!notification.is_read && (
                              <div className="h-2 w-2 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                            )}
                          </div>
                          <p className={cn(
                            "text-sm text-muted-foreground transition-all",
                            isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"
                          )}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <p className="text-xs text-white/70 font-medium">Click again to go to settings</p>
                            </div>
                          )}
                        </div>
                        <button
                          data-delete
                          onClick={(e) => handleDeleteNotification(notification.id, e)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded z-10"
                          aria-label="Delete notification"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

