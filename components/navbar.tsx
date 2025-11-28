"use client"

import Link from "next/link"
import { Logo } from "@/components/logo"
import { MobileMenu } from "@/components/mobile-menu"
import { NavbarAuth } from "@/components/navbar-auth"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? "glass-card border-b border-border/50 shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <Logo />
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <Link href="/marketplace" className="text-sm font-semibold tracking-wide hover:text-primary transition-colors">
              Marketplace
            </Link>
            <Link href="/reviews" className="text-sm font-semibold tracking-wide hover:text-primary transition-colors">
              Reviews
            </Link>
            <Link href="/about" className="text-sm font-semibold tracking-wide hover:text-primary transition-colors">
              About
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <NavbarAuth isAuthenticated={isAuthenticated} />
            </div>
            <MobileMenu />
          </div>
        </div>
      </div>
    </nav>
  )
}
