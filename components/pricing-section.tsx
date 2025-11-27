"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import { QuoteFormDialog } from "@/components/quote-form-dialog"

const pricingTiers = [
  {
    name: "Basis Website",
    price: "€999",
    features: [
      "Tot 5 pagina's",
      "Responsive design",
      "Basis SEO optimalisatie",
      "Contactformulier",
      "1 maand gratis onderhoud",
    ],
    highlighted: false,
  },
  {
    name: "Pro Pakket",
    price: "€2.499",
    features: [
      "Tot 15 pagina's",
      "Premium design",
      "Geavanceerde SEO",
      "CMS integratie",
      "E-commerce functionaliteit",
      "3 maanden gratis onderhoud",
    ],
    highlighted: true,
  },
  {
    name: "Maatwerk",
    price: "Op aanvraag",
    features: [
      "Onbeperkt aantal pagina's",
      "Custom functionaliteiten",
      "API integraties",
      "Dedicated projectmanager",
      "6 maanden gratis onderhoud",
    ],
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    null
  )
}
