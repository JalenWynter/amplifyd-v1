"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { MobileMenu } from "@/components/mobile-menu"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
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
            <Link href="#features" className="text-sm font-semibold tracking-wide hover:text-primary transition-colors">
              Artist
            </Link>
            <Link href="#pricing" className="text-sm font-semibold tracking-wide hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="#about" className="text-sm font-semibold tracking-wide hover:text-primary transition-colors">
              About
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" className="text-sm font-semibold hover:text-primary transition-colors" asChild>
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button
                className="bg-primary text-white hover:bg-primary/90 font-semibold text-sm shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40"
                asChild
              >
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </div>
    </nav>
  )
}
