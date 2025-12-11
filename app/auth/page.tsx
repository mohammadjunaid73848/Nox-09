"use client"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"

export default function AuthLanding() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-svh w-full relative bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/fantasy-hero.png" alt="Fantasy landscape" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Back button */}
      <div className="relative z-20 p-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Smooth curved separator */}
      <div className="absolute top-64 left-0 right-0 h-32 bg-gradient-to-b from-blue-400/30 via-blue-500/60 to-blue-600 rounded-b-3xl blur-2xl" />

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm flex flex-col items-center gap-12">
          {/* Branding */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Noxyai</h1>
            <p className="text-gray-200">Your AI companion for any task</p>
          </div>

          {/* Auth buttons */}
          <div className="w-full flex flex-col gap-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-black text-white hover:bg-gray-800 h-12 font-semibold text-base rounded-lg"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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

            <Link href="/auth/email/signup" className="w-full">
              <Button className="w-full bg-white text-black hover:bg-gray-100 h-12 font-semibold text-base rounded-lg">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Continue with Email
              </Button>
            </Link>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <p className="text-sm text-gray-300">
            Already have account?{" "}
            <Link href="/auth/email/signin" className="underline font-semibold hover:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-3 py-6 relative z-10">
        <p className="text-xs text-gray-300">
          I have read and agree to{" "}
          <Link href="/terms" className="underline hover:text-white font-semibold">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-white font-semibold">
            Privacy Policy
          </Link>
        </p>
        <div className="flex justify-center gap-4 text-xs text-gray-300">
          <Link href="/terms" className="underline hover:text-white">
            Terms
          </Link>
          <span>•</span>
          <Link href="/privacy" className="underline hover:text-white">
            Privacy
          </Link>
          <span>•</span>
          <a href="mailto:support@noxyai.com" className="underline hover:text-white">
            Support
          </a>
        </div>
      </div>
    </div>
  )
}
