"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { verifyPaymentStatus } from "@/app/actions/verify"

interface VerifyPaymentButtonProps {
  orderId: string
  onVerified?: () => void
}

export function VerifyPaymentButton({ orderId, onVerified }: VerifyPaymentButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleVerify = async () => {
    setIsVerifying(true)
    setMessage(null)
    try {
      const result = await verifyPaymentStatus(orderId)

      if (result.success) {
        setMessage({ type: 'success', text: 'Payment verified! Order status updated to paid.' })
        // Call callback to refresh data
        if (onVerified) {
          onVerified()
        }
        // Reload the page to show updated status
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: result.error || 'Could not verify payment status.' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred while verifying payment.' })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleVerify}
        disabled={isVerifying}
        variant="outline"
        size="sm"
        className="text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-300"
      >
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Verify Payment
          </>
        )}
      </Button>
      {message && (
        <div
          className={`text-xs px-2 py-1 rounded ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : 'bg-red-500/20 text-red-400 border border-red-500/50'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="inline h-3 w-3 mr-1" />
          ) : (
            <AlertCircle className="inline h-3 w-3 mr-1" />
          )}
          {message.text}
        </div>
      )}
    </div>
  )
}

