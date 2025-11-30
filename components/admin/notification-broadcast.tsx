'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Bell, Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { sendSiteWideNotification, NotificationType } from '@/app/actions/notifications'
import { useToast } from '@/hooks/use-toast'

const NOTIFICATION_TEMPLATES: Array<{
  id: string
  title: string
  message: string
  type: NotificationType
  linkUrl: string | null
  description: string
}> = [
  {
    id: 'welcome',
    title: 'Welcome to Amplifyd!',
    message: 'Complete your profile to get started.',
    type: 'system',
    linkUrl: '/dashboard/settings',
    description: 'Welcome message for new users'
  },
  {
    id: 'maintenance',
    title: 'Scheduled Maintenance',
    message: 'We will be performing scheduled maintenance on [DATE] from [TIME]. The site may be temporarily unavailable.',
    type: 'system',
    linkUrl: null,
    description: 'Maintenance announcement'
  },
  {
    id: 'feature',
    title: 'New Feature Available!',
    message: 'Check out our latest feature: [FEATURE_NAME]. [DESCRIPTION]',
    type: 'system',
    linkUrl: '/dashboard',
    description: 'New feature announcement'
  },
  {
    id: 'payment_issue',
    title: 'Payment Processing Update',
    message: 'We are experiencing temporary issues with payment processing. Please try again in a few minutes.',
    type: 'system',
    linkUrl: '/support',
    description: 'Payment system issue notification'
  },
  {
    id: 'review_delay',
    title: 'Review Processing Delay',
    message: 'We are experiencing higher than usual review volumes. Your review may take longer than expected. Thank you for your patience.',
    type: 'system',
    linkUrl: '/dashboard',
    description: 'Review processing delay notice'
  },
  {
    id: 'security',
    title: 'Security Update',
    message: 'For your security, please update your password if you haven\'t done so recently.',
    type: 'system',
    linkUrl: '/dashboard/settings',
    description: 'Security-related notification'
  },
  {
    id: 'promo',
    title: 'Special Promotion',
    message: 'Limited time offer: [PROMO_DETAILS]. Use code [CODE] at checkout.',
    type: 'system',
    linkUrl: '/marketplace',
    description: 'Promotional announcement'
  },
  {
    id: 'policy',
    title: 'Policy Update',
    message: 'We have updated our terms of service and privacy policy. Please review the changes.',
    type: 'system',
    linkUrl: '/about',
    description: 'Policy update notification'
  }
]

export function NotificationBroadcast() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [type, setType] = useState<NotificationType>('system')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null)

  const handleTemplateSelect = (templateId: string) => {
    const template = NOTIFICATION_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setTitle(template.title)
      setMessage(template.message)
      setLinkUrl(template.linkUrl || '')
      setType(template.type)
      setSelectedTemplate(templateId)
    }
  }

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and message are required',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await sendSiteWideNotification(
        title.trim(),
        message.trim(),
        linkUrl.trim() || null,
        type
      )

      if (response.success) {
        setResult({
          success: true,
          message: `Notification sent successfully to ${response.count || 0} users`,
          count: response.count
        })
        toast({
          title: 'Success!',
          description: `Notification sent to ${response.count || 0} users`,
        })
        // Reset form
        setTitle('')
        setMessage('')
        setLinkUrl('')
        setSelectedTemplate(null)
      } else {
        setResult({
          success: false,
          message: response.error || 'Failed to send notification'
        })
        toast({
          title: 'Error',
          description: response.error || 'Failed to send notification',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'An unexpected error occurred'
      })
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Site-Wide Notification Broadcast
        </CardTitle>
        <CardDescription className="text-white/60">
          Send notifications to all users on the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-3">
          <Label className="text-white">Quick Templates</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {NOTIFICATION_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedTemplate === template.id
                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <p className="text-xs font-medium text-white mb-1">{template.title}</p>
                <p className="text-xs text-white/50 line-clamp-2">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Result Alert */}
        {result && (
          <Alert className={result.success ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            <AlertDescription className={result.success ? 'text-green-300' : 'text-red-300'}>
              {result.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className="bg-white/5 border-white/20 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-white">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification message"
              className="bg-white/5 border-white/20 text-white min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkUrl" className="text-white">Link URL (Optional)</Label>
            <Input
              id="linkUrl"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/dashboard, /marketplace, etc."
              className="bg-white/5 border-white/20 text-white"
            />
            <p className="text-xs text-white/50">Users will be redirected here when clicking the notification</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-white">Type</Label>
            <div className="flex gap-2 flex-wrap">
              {(['system', 'payment', 'review', 'order'] as NotificationType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    type === t
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={loading || !title.trim() || !message.trim()}
            className="w-full bg-[#8B5CF6] text-white hover:bg-[#7C3AED]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send to All Users
              </>
            )}
          </Button>

          <p className="text-xs text-white/50 text-center">
            This will send a notification to all registered users on the platform
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

