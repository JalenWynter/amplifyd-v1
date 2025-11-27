"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "Snel en doeltreffend! Ik zocht een logo die mijn bedrijf perfect zou laten zien en bij MSwebdesign hebben ze mij niet teleurgesteld. :)",
    name: "Patrick",
    role: "Ondernemer",
  },
  {
    quote:
      "Voor onze stichting wilden we onze oude website volledig vernieuwen en een heleboel handmatige taken automatiseren. MSwebdesign heeft voor ons een mooi product neergezet, volledig op maat met programmatuur waardoor we niet meer alles handmatig hoeven te doen.",
    name: "Mehmet",
    role: "Voorzitter non-profit stichting",
  },
  {
    quote:
      "Voor mijn nieuwe bedrijf wilde ik een mooie frisse website die als visitekaartje zou functioneren. Nu heb ik een prachtige en snelle website die ook nog eens goed te vinden is op Google! Echt top.",
    name: "Youri",
    role: "Ondernemer",
  },
]

export function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let animationFrameId: number
    let scrollPosition = 0
    const scrollSpeed = 0.5

    const scroll = () => {
      scrollPosition += scrollSpeed

      if (scrollContainer.scrollWidth && scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0
      }

      scrollContainer.scrollLeft = scrollPosition
      animationFrameId = requestAnimationFrame(scroll)
    }

    animationFrameId = requestAnimationFrame(scroll)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    null
  )
}
