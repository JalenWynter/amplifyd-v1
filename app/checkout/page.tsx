"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Checkout from "@/components/checkout"
import { PRODUCTS, formatPrice } from "@/lib/products"

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const productId = searchParams.get("product")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  useEffect(() => {
    const files = searchParams.get("files")
    if (files) {
      setUploadedFiles(files.split(","))
    }
  }, [searchParams])

  const product = PRODUCTS.find((p) => p.id === productId)

  if (!productId || !product) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Product</h1>
          <p className="text-gray-400 mb-6">Please select a valid pricing plan.</p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Button onClick={() => router.push("/")} variant="ghost" className="mb-8 text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Complete Your Order</h1>
          <p className="text-gray-400">Secure checkout powered by Stripe</p>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">Uploaded Files</h3>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {file}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{product.name}</h2>
              <p className="text-gray-400">{product.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{formatPrice(product.priceInCents)}</div>
              <div className="text-sm text-gray-400">one-time payment</div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-white mb-3">What's included:</h3>
            <ul className="space-y-2">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8">
          <Checkout productId={productId} />
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
