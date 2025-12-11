"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function MobileAuthPage() {
  const router = useRouter()
  const [isDesktop, setIsDesktop] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push("/chat")
        return
      }
    }

    checkAuth()

    // Check if device is desktop
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    checkDevice()
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [router])

  // Redirect to desktop login if on desktop
  useEffect(() => {
    if (isDesktop) {
      router.push("/auth/login")
    }
  }, [isDesktop, router])

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsLoading(false)
    }
  }

  if (isDesktop) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      {/* Background Image Section */}
      <div className="relative w-full h-80 overflow-hidden">
        <img src="/auth-landscape-bg.jpg" alt="NoxyAI landscape" className="w-full h-full object-cover" />
        {/* Logo overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-8">
          <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-between px-6 py-8">
        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-14 bg-black text-white rounded-full text-base font-semibold flex items-center justify-center gap-3 hover:bg-gray-900"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <Link href="/auth/sign-up" className="block">
            <Button className="w-full h-14 bg-gray-200 text-black rounded-full text-base font-semibold hover:bg-gray-300">
              Continue with Email
            </Button>
          </Link>

          <Link href="/auth/login" className="block mt-6">
            <Button variant="ghost" className="w-full h-12 text-black text-base">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Footer Links */}
        <div className="border-t pt-6 space-y-4">
          <p className="text-xs text-center text-gray-600 leading-relaxed">
            I have read and agree to{" "}
            <Link href="/terms" className="text-black underline font-semibold">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-black underline font-semibold">
              Privacy Policy
            </Link>
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/feedback" className="text-xs text-gray-600 hover:text-black underline">
              Feedback
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/support" className="text-xs text-gray-600 hover:text-black underline">
              Support
            </Link>
          </div>
        </div>

        {error && <div className="text-xs text-red-500 text-center mt-4 p-2 bg-red-50 rounded">{error}</div>}
      </div>
    </div>
  )
}
