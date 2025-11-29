"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Checkout from "@/components/checkout"
import { createClient } from "@/utils/supabase/client"
import { formatPrice } from "@/lib/products"

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reviewerId = searchParams.get("reviewerId")
  const packageId = searchParams.get("packageId")
  const fileUrl = searchParams.get("fileUrl") || ""
  const fileTitle = searchParams.get("fileTitle") || "Untitled Track"
  
  const [reviewer, setReviewer] = useState<any>(null)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (error || !reviewerId || !packageId || !selectedPackage) {
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

        {fileUrl && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">Track</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              {fileTitle}
            </div>
          </div>
        )}

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {selectedPackage.title || selectedPackage.name}
              </h2>
              <p className="text-gray-400">{selectedPackage.description}</p>
              {reviewer?.full_name && (
                <p className="text-gray-500 text-sm mt-1">by {reviewer.full_name}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                ${selectedPackage.price?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-400">one-time payment</div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-white mb-3">What's included:</h3>
            <ul className="space-y-2">
              {selectedPackage.features && Array.isArray(selectedPackage.features) ? (
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

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8">
          <Checkout 
            reviewerId={reviewerId}
            packageId={packageId}
            fileUrl={fileUrl}
            fileTitle={fileTitle}
          />
        </div>
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
