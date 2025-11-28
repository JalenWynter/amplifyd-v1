'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions'
import { useRouter } from 'next/navigation'

export function NavbarAuth({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.refresh()
  }

  if (isAuthenticated) {
    return (
      <>
        <Button variant="ghost" className="text-sm font-semibold hover:text-primary transition-colors" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <form action={handleSignOut}>
          <Button
            type="submit"
            variant="ghost"
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            Sign Out
          </Button>
        </form>
      </>
    )
  }

  return (
    <>
      <Button variant="ghost" className="text-sm font-semibold hover:text-primary transition-colors" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
      <Button
        className="bg-primary text-white hover:bg-primary/90 font-semibold text-sm shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40"
        asChild
      >
        <Link href="/signup">Sign Up</Link>
      </Button>
    </>
  )
}

