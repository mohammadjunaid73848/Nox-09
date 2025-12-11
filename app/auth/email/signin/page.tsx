"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/chat")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-svh w-full relative overflow-hidden bg-white">
      <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none overflow-hidden z-0">
        <img src="/waterfall-header.png" alt="Waterfall Background" className="w-full h-full object-cover" />
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

      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 relative z-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <Card className="bg-white/95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-2xl">Sign in to Noxyai</CardTitle>
                <CardDescription>Enter your email below to access your chat history</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="/auth/forgot-password" className="text-sm underline underline-offset-4">
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                          onClick={() => {
                            const input = document.getElementById("password") as HTMLInputElement
                            input.type = input.type === "password" ? "text" : "password"
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-center text-gray-600">
                      By signing in, you accept our{" "}
                      <Link href="/terms" className="underline underline-offset-4 hover:text-black">
                        Terms and Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="underline underline-offset-4 hover:text-black">
                        Privacy Policy
                      </Link>
                    </p>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </div>

                  <div className="mt-4 text-center text-sm">
                    Don't have an account?{" "}
                    <Link
                      href="/auth/email/signup"
                      className="underline underline-offset-4 font-semibold hover:text-gray-600"
                    >
                      Sign Up
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="text-center space-y-2">
              <div className="flex justify-center gap-3 text-xs text-gray-600">
                <Link href="/terms" className="hover:text-black underline">
                  Terms
                </Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-black underline">
                  Privacy
                </Link>
                <span>•</span>
                <a href="mailto:support@noxyai.com" className="hover:text-black underline">
                  Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
