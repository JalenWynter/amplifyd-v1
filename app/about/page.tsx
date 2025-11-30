"use client"

import Link from "next/link"
import Image from "next/image"
import { NavbarAuth } from "@/components/navbar-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  Sparkles,
  Users,
  Music,
  Award,
  Target,
  Heart,
  Zap,
  ArrowRight,
  Star,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"

const values = [
  {
    icon: Award,
    title: "Quality First",
    description: "We connect you with verified, professional reviewers who meet the highest industry standards.",
  },
  {
    icon: Target,
    title: "Precision Focus",
    description: "Every review is detailed, actionable, and tailored to elevate your music to the next level.",
  },
  {
    icon: Heart,
    title: "Artist-Centric",
    description: "Your creative vision and goals are always at the center of everything we do.",
  },
  {
    icon: Zap,
    title: "Fast Turnaround",
    description: "Get professional feedback quickly without compromising on quality or depth.",
  },
  {
    icon: Users,
    title: "Trusted Network",
    description: "Access a curated community of experienced professionals from the music industry.",
  },
  {
    icon: Sparkles,
    title: "Innovation",
    description: "Leveraging cutting-edge technology to streamline the review process for modern artists.",
  },
]

const stats = [
  { number: "500+", label: "Reviews Completed" },
  { number: "200+", label: "Active Artists" },
  { number: "50+", label: "Professional Reviewers" },
  { number: "4.9", label: "Average Rating", icon: Star },
]

const team = [
  {
    name: "Our Mission",
    role: "Empowering Artists",
    description: "We believe every artist deserves access to professional feedback that helps them grow. Our platform bridges the gap between emerging talent and industry expertise.",
    image: "/placeholder-user.jpg",
  },
  {
    name: "Our Vision",
    role: "Building Community",
    description: "Creating a thriving ecosystem where artists and reviewers collaborate to push the boundaries of musical excellence and innovation.",
    image: "/placeholder-user.jpg",
  },
]

export default function AboutPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }

    fetchSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchSession()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Header with Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white transition hover:text-[#C4B5FD]">
              Amplifyd Studio
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/marketplace" className="text-sm font-semibold text-white/70 hover:text-white transition">
                Marketplace
              </Link>
              <Link href="/reviews" className="text-sm font-semibold text-white/70 hover:text-white transition">
                Reviews
              </Link>
              <Link href="/about" className="text-sm font-semibold text-white rounded-full bg-white/10 px-4 py-2">
                About
              </Link>
              <Link href="/support" className="text-sm font-semibold text-white/70 hover:text-white transition">
                Contact
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <NavbarAuth isAuthenticated={isAuthenticated} />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 lg:px-8 py-12 max-w-7xl space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6 pt-8">
          <Badge className="border border-white/20 bg-white/10 text-white">
            About Amplifyd Studio
          </Badge>
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            Empowering Artists Through
            <span className="block text-[#C4B5FD]">Professional Feedback</span>
          </h1>
          <p className="text-lg text-white/70 max-w-3xl mx-auto leading-relaxed">
            Amplifyd Studio is the premier platform connecting independent artists with verified,
            professional music reviewers. We believe every artist deserves access to industry-level
            feedback that helps them refine their craft and reach new heights.
          </p>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="border-white/10 bg-white/5 backdrop-blur-xl text-center transition-all duration-300 hover:border-[#8B5CF6]/30 hover:bg-white/10"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {stat.icon && <stat.icon className="h-5 w-5 text-[#FACC15]" />}
                  <div className="text-4xl font-bold text-white">{stat.number}</div>
                </div>
                <p className="text-sm text-white/60">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Mission & Vision */}
        <section className="grid gap-8 md:grid-cols-2">
          {team.map((item, index) => (
            <Card
              key={index}
              className="border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:border-[#8B5CF6]/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-[#8B5CF6]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl">{item.name}</CardTitle>
                    <CardDescription className="text-[#C4B5FD]">{item.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Values Section */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Our Core Values</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              The principles that guide everything we do at Amplifyd Studio
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <Card
                  key={index}
                  className="border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:border-[#8B5CF6]/30 hover:bg-white/10 group"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 group-hover:bg-[#8B5CF6]/30 transition-colors">
                        <Icon className="h-5 w-5 text-[#C4B5FD]" />
                      </div>
                      <CardTitle className="text-white text-lg">{value.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white md:text-4xl">How It Works</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              A simple, streamlined process to get professional feedback on your music
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Browse Reviewers",
                description: "Explore our marketplace of verified professional reviewers, each with their own specialties and expertise.",
              },
              {
                step: "02",
                title: "Select a Package",
                description: "Choose the review package that best fits your needs, from quick feedback to comprehensive analysis.",
              },
              {
                step: "03",
                title: "Get Feedback",
                description: "Receive detailed, actionable feedback from industry professionals to elevate your music.",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:border-[#8B5CF6]/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 text-8xl font-bold text-white/5">
                  {item.step}
                </div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-white text-xl mb-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-white/70 leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#8B5CF6]/10 to-transparent backdrop-blur-xl p-8 md:p-12 text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Ready to Elevate Your Music?
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Join hundreds of artists who are already getting professional feedback to take their
              music to the next level.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              className="bg-[#8B5CF6] text-white hover:bg-[#7C3AED] px-8 py-6 text-lg"
            >
              <Link href="/marketplace">
                Browse Reviewers
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 px-8 py-6 text-lg"
            >
              <Link href="/support">Contact Us</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
