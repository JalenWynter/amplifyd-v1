'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { login, signInWithGoogle } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Chrome } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    const result = await login(formData)

    if (result?.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      })
      setIsLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true)
    const result = await signInWithGoogle()

    if (result?.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      })
      setIsLoading(false)
    } else if (result?.url) {
      window.location.href = result.url
    }
  }

  return (
    <div className="min-h-screen bg-[#80808012] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md glass-card border-border/50 backdrop-blur-xl bg-background/80 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#6A00D7] hover:bg-[#6A00D7]/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Chrome className="mr-2 h-4 w-4" />
            Sign In with Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-[#6A00D7] hover:underline font-semibold"
            >
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

