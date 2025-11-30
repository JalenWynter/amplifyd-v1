"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Checkout from "@/components/checkout"
import { TrackUpload } from "@/components/track-upload"
import { createClient } from "@/utils/supabase/client"
import { startCheckoutSession } from "@/app/actions/stripe"
import { validatePromoCode } from "@/app/actions/promo-codes"
import { Tag, CheckCircle2, X } from "lucide-react"

interface CheckoutSessionData {
  trackUrl: string
  trackTitle: string
  note: string
  timestamp: number
}

const CHECKOUT_SESSION_KEY = "checkout_session_data"
const SESSION_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

// Helper functions for session management
const loadSavedSession = (): CheckoutSessionData | null => {
  if (typeof window === "undefined") return null
  
  try {
    const saved = localStorage.getItem(CHECKOUT_SESSION_KEY)
    if (!saved) return null
    
    const data: CheckoutSessionData = JSON.parse(saved)
    const now = Date.now()
    
    // Check if session is still valid (less than 5 minutes old)
    if (now - data.timestamp < SESSION_DURATION) {
      return data
    } else {
      // Session expired, remove it
      localStorage.removeItem(CHECKOUT_SESSION_KEY)
      return null
    }
  } catch (error) {
    console.error("Error loading saved session:", error)
    return null
  }
}

const saveSession = (trackUrl: string, trackTitle: string, note: string) => {
  if (typeof window === "undefined") return
  
  try {
    const data: CheckoutSessionData = {
      trackUrl,
      trackTitle,
      note,
      timestamp: Date.now(),
    }
    localStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Error saving session:", error)
  }
}

const clearSession = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem(CHECKOUT_SESSION_KEY)
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reviewerId = searchParams.get("reviewerId")
  const packageId = searchParams.get("packageId")
  const initialTrackUrl = searchParams.get("trackUrl") || ""
  const initialTrackTitle = searchParams.get("trackTitle") || "Untitled Track"
  
  // Initialize state with saved session or URL params
  const savedSession = loadSavedSession()
  const [trackUrl, setTrackUrl] = useState(
    savedSession?.trackUrl || initialTrackUrl
  )
  const [trackTitle, setTrackTitle] = useState(
    savedSession?.trackTitle || initialTrackTitle
  )
  const [note, setNote] = useState(savedSession?.note || "")
  const [promoCode, setPromoCode] = useState("")
  const [promoCodeValid, setPromoCodeValid] = useState<{
    valid: boolean
    discount?: { type: 'percentage' | 'fixed'; value: number }
    error?: string
  } | null>(null)
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  
  // Package/reviewer data
  const [reviewer, setReviewer] = useState<any>(null)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Save session data whenever form fields change
  useEffect(() => {
    if (trackUrl || trackTitle || note) {
      saveSession(trackUrl, trackTitle, note)
    }
  }, [trackUrl, trackTitle, note])

  // Clear session when payment is successful (clientSecret is set)
  useEffect(() => {
    if (clientSecret) {
      clearSession()
    }
  }, [clientSecret])

  useEffect(() => {
    async function fetchReviewerAndPackage() {
      if (!reviewerId || !packageId) {
        setError("Missing required parameters")
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: reviewerProfile, error: reviewerError } = await supabase
          .from('profiles')
          .select('pricing_packages, full_name, email')
          .eq('id', reviewerId)
          .single()

        if (reviewerError || !reviewerProfile) {
          throw new Error(`Reviewer not found: ${reviewerError?.message || 'Unknown error'}`)
        }

        const pricingPackages = reviewerProfile.pricing_packages as any[]
        if (!Array.isArray(pricingPackages)) {
          throw new Error('Invalid pricing packages format')
        }

        const pkg = pricingPackages.find((p: any) => p.id === packageId)
        if (!pkg) {
          throw new Error(`Package not found`)
        }

        setReviewer(reviewerProfile)
        setSelectedPackage(pkg)
      } catch (err: any) {
        setError(err.message || 'Failed to load package details')
      } finally {
        setLoading(false)
      }
    }

    fetchReviewerAndPackage()
  }, [reviewerId, packageId])

  const handleValidatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeValid(null)
      return
    }

    setIsValidatingPromo(true)
    try {
      const validation = await validatePromoCode(promoCode.trim())
      setPromoCodeValid(validation)
    } catch (err: any) {
      setPromoCodeValid({ valid: false, error: err.message || 'Failed to validate promo code' })
    } finally {
      setIsValidatingPromo(false)
    }
  }

  const handleProceedToPayment = async () => {
    // Clear previous errors
    setError(null)

    // Validate required fields
    const trimmedTitle = trackTitle.trim()
    
    if (!reviewerId || !packageId) {
      setError("Missing package information. Please go back and try again.")
      return
    }

    if (!trimmedTitle || trimmedTitle.length < 1) {
      setError("Track title is required and must be at least 1 character.")
      return
    }

    if (!trackUrl || trackUrl.trim() === "") {
      setError("Please upload a track before proceeding to payment.")
      return
    }

    // Validate promo code if entered
    if (promoCode.trim() && (!promoCodeValid || !promoCodeValid.valid)) {
      await handleValidatePromoCode()
      if (!promoCodeValid || !promoCodeValid.valid) {
        setError("Please enter a valid promo code or remove it.")
        return
      }
    }

    setIsSubmitting(true)

    try {
      const result = await startCheckoutSession(
        reviewerId,
        packageId,
        trackUrl,
        trimmedTitle,
        note.trim() || undefined,
        promoCodeValid?.valid ? promoCode.trim() : undefined
      )

      if (result.clientSecret) {
        setClientSecret(result.clientSecret)
        setOrderId(result.orderId)
      } else {
        setError("Failed to initialize payment. Please try again.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to start checkout session")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    if (!selectedPackage || !promoCodeValid?.valid || !promoCodeValid.discount) {
      return selectedPackage?.price || 0
    }

    const originalPrice = selectedPackage.price
    const discount = promoCodeValid.discount

    if (discount.type === 'percentage') {
      return originalPrice - (originalPrice * discount.value / 100)
    } else {
      return Math.max(0, originalPrice - discount.value)
    }
  }

  const finalPrice = calculateDiscountedPrice()
  const discountAmount = selectedPackage ? selectedPackage.price - finalPrice : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-gray-400">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (!reviewerId || !packageId || !selectedPackage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Package</h1>
          <p className="text-gray-400 mb-6">{error || "Please select a valid package."}</p>
          <Button onClick={() => router.push("/marketplace")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back to Marketplace
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Button onClick={() => router.push("/marketplace")} variant="ghost" className="mb-8 text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Complete Your Order</h1>
          <p className="text-gray-400">Secure checkout powered by Stripe</p>
        </div>

        {/* Package Details Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {selectedPackage?.title || selectedPackage?.name}
              </h2>
              <p className="text-gray-400">{selectedPackage?.description}</p>
              {reviewer?.full_name && (
                <p className="text-gray-500 text-sm mt-1">by {reviewer.full_name}</p>
              )}
            </div>
            <div className="text-right">
              {discountAmount > 0 ? (
                <>
                  <div className="text-lg text-gray-400 line-through">
                    ${selectedPackage?.price?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-3xl font-bold text-green-400">
                    ${finalPrice.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-400/70">
                    Save ${discountAmount.toFixed(2)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">
                    ${selectedPackage?.price?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-400">one-time payment</div>
                </>
              )}
            </div>
          </div>
          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-white mb-3">What's included:</h3>
            <ul className="space-y-2">
              {selectedPackage?.features && Array.isArray(selectedPackage.features) ? (
                selectedPackage.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-400">No features listed</li>
              )}
            </ul>
          </div>
        </div>

        {/* Step 1: Order Details Form */}
        {!clientSecret && (
          <Card className="border-slate-800 bg-slate-900/50 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Order Details</CardTitle>
              <CardDescription className="text-gray-400">
                Review and customize your order before proceeding to payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Track Upload Section */}
              <div className="space-y-2">
                <Label className="text-white">
                  Upload Track <span className="text-red-400">*</span>
                </Label>
                <TrackUpload
                  onUploadComplete={(url, fileName) => {
                    setTrackUrl(url)
                    const newTitle = fileName.replace(/\.[^/.]+$/, "") // Remove extension
                    if (!trackTitle || trackTitle === "Untitled Track") {
                      setTrackTitle(newTitle)
                    }
                    // Save immediately after upload
                    saveSession(url, trackTitle !== "Untitled Track" ? trackTitle : newTitle, note)
                    setError(null)
                  }}
                  existingUrl={trackUrl}
                  existingTitle={trackTitle !== "Untitled Track" ? trackTitle : undefined}
                />
                {!trackUrl && (
                  <p className="text-yellow-400/70 text-xs mt-1 text-center">
                    You must upload a track before proceeding to payment
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackTitle" className="text-white">
                  Track Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="trackTitle"
                  type="text"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  placeholder="Enter your track title"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500"
                  required
                />
              </div>

              {/* Promo Code Section */}
              <div className="space-y-2">
                <Label htmlFor="promoCode" className="text-white">
                  Promo Code <span className="text-gray-500 text-sm">(optional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="promoCode"
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase())
                      setPromoCodeValid(null)
                    }}
                    onBlur={handleValidatePromoCode}
                    placeholder="Enter promo code"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 uppercase"
                  />
                  <Button
                    type="button"
                    onClick={handleValidatePromoCode}
                    disabled={!promoCode.trim() || isValidatingPromo}
                    variant="outline"
                    className="shrink-0"
                  >
                    {isValidatingPromo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Tag className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {promoCodeValid && (
                  <div className={`flex items-center gap-2 text-sm p-2 rounded ${
                    promoCodeValid.valid 
                      ? 'bg-green-500/10 border border-green-500/50 text-green-400' 
                      : 'bg-red-500/10 border border-red-500/50 text-red-400'
                  }`}>
                    {promoCodeValid.valid ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {promoCodeValid.discount?.type === 'percentage' 
                            ? `${promoCodeValid.discount.value}% off applied!`
                            : `$${promoCodeValid.discount?.value} off applied!`
                          }
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPromoCode("")
                            setPromoCodeValid(null)
                          }}
                          className="ml-auto h-6 w-6 p-0 text-green-400 hover:text-green-300"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        <span>{promoCodeValid.error || 'Invalid promo code'}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-white">
                  Note to Reviewer <span className="text-gray-500 text-sm">(optional, max 200 characters)</span>
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => {
                    if (e.target.value.length <= 200) {
                      setNote(e.target.value)
                    }
                  }}
                  placeholder="Add any special instructions or notes for the reviewer..."
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 min-h-24"
                  maxLength={200}
                />
                <p className="text-gray-500 text-xs text-right">
                  {note.length}/200 characters
                </p>
              </div>

              <Button
                onClick={handleProceedToPayment}
                disabled={isSubmitting || !trackTitle.trim() || trackTitle.trim().length < 1 || !trackUrl || trackUrl.trim() === ""}
                className="w-full bg-primary hover:bg-primary/90 text-white"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Payment */}
        {clientSecret && !paymentSuccess && (
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Payment</CardTitle>
              <CardDescription className="text-gray-400">
                Complete your payment securely
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Checkout 
                clientSecret={clientSecret}
                orderId={orderId}
                onPaymentSuccess={() => {
                  setPaymentSuccess(true)
                  clearSession()
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Payment Success Dialog */}
        <Dialog open={paymentSuccess} onOpenChange={() => {}}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <DialogTitle className="text-2xl text-center text-white">
                Thanks for your payment!
              </DialogTitle>
              <DialogDescription className="text-center text-gray-400 mt-2">
                A payment to HustlerzHQ sandbox will appear on your statement.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 text-center">
              <p className="text-white/80 mb-6">You're all set</p>
              <Button
                onClick={() => {
                  setPaymentSuccess(false)
                  router.push('/')
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white"
                size="lg"
              >
                Return to Homepage
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-white">Loading checkout...</div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
