import Link from "next/link"
import { Github, Linkedin, Twitter } from "lucide-react"

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
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  Pricing
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
            <h4 className="font-bold mb-6 tracking-wide uppercase text-sm">Connect</h4>
            <div className="flex gap-4">
              <Link
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-all p-2 rounded-lg hover:bg-primary/10"
              >
                <Linkedin className="h-5 w-5" strokeWidth={2} />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-all p-2 rounded-lg hover:bg-primary/10"
              >
                <Github className="h-5 w-5" strokeWidth={2} />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-all p-2 rounded-lg hover:bg-primary/10"
              >
                <Twitter className="h-5 w-5" strokeWidth={2} />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
