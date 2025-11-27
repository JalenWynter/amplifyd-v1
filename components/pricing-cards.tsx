"use client"

import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PRODUCTS, formatPrice } from "@/lib/products"

export default function PricingCards({ uploadedFiles }: { uploadedFiles?: string[] }) {
  const router = useRouter()

  const handleSelectPlan = (productId: string) => {
    const filesParam =
      uploadedFiles && uploadedFiles.length > 0 ? `&files=${encodeURIComponent(uploadedFiles.join(","))}` : ""
    router.push(`/checkout?product=${productId}${filesParam}`)
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {PRODUCTS.map((product) => (
        <div
          key={product.id}
          className={`relative bg-slate-900/50 backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] ${
            product.recommended
              ? "border-primary shadow-[0_0_30px_rgba(255,0,85,0.3)]"
              : "border-slate-800 hover:border-slate-700"
          }`}
        >
          {product.recommended && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-sm font-bold px-4 py-1 rounded-full">
              Best Value
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
            <p className="text-gray-400 text-sm">{product.description}</p>
          </div>

          <div className="mb-6">
            <div className="text-5xl font-bold text-white mb-1">{formatPrice(product.priceInCents)}</div>
            <div className="text-gray-400 text-sm">one-time payment</div>
          </div>

          <Button
            onClick={() => handleSelectPlan(product.id)}
            className={`w-full mb-6 ${
              product.recommended
                ? "bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(255,0,85,0.5)]"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
            }`}
            size="lg"
          >
            Select Plan
          </Button>

          <ul className="space-y-3">
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-300">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
