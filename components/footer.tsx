import Link from "next/link"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="glass-card border-t border-border/50 py-16 px-6 lg:px-8 mt-32">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-4 tracking-tight">Audio Pro</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Professional audio reviews by engineers 
            </p>
            <p className="text-xs text-muted-foreground mt-4">© 2025 All rights reserved.</p>
          </div>

          <div>
            <h4 className="font-bold mb-6 tracking-wide uppercase text-sm">Navigate</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/marketplace"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  Marketplace
                </Link>
              </li>
              <li>
                <Link
                  href="#about"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 tracking-wide uppercase text-sm">Support</h4>
            <Link href="/support">
              <Button className="w-full sm:w-auto" variant="outline">
                <HelpCircle className="h-4 w-4 mr-2" />
                Support Ticket
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
