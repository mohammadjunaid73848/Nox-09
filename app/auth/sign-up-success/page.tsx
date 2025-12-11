"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Loader2 } from "lucide-react"

export default function SignUpSuccessPage() {
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [resendError, setResendError] = useState("")
  const [timeLeft, setTimeLeft] = useState(0)
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const log = `[${timestamp}] ${message}`
    console.log(`[v0] ${log}`)
    setDebugLogs((prev) => [...prev.slice(-49), log])
  }

  // Get email from URL or localStorage
  const getEmail = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      return params.get("email") || localStorage.getItem("signupEmail") || ""
    }
    return ""
  }

  const handleResendConfirmation = async () => {
    const email = getEmail()
    addDebugLog("Resend confirmation clicked - email: " + email)

    if (!email) {
      addDebugLog("Email not found in storage")
      setResendError("Email not found. Please try signing up again.")
      return
    }

    setIsResending(true)
    setResendError("")
    setResendMessage("")

    try {
      addDebugLog("Calling /api/resend-confirmation")
      const response = await fetch("/api/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      addDebugLog("Response status: " + response.status)
      const data = await response.json()
      addDebugLog("Response data: " + JSON.stringify(data))

      if (!response.ok) {
        const errorMsg = data.error || "Failed to resend confirmation email"
        addDebugLog("Error response: " + errorMsg)
        setResendError(errorMsg)

        if (response.status === 429 && data.waitMinutes) {
          addDebugLog("Rate limited for: " + data.waitMinutes + " minutes")
          setTimeLeft(data.waitMinutes * 60)
          const interval = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                clearInterval(interval)
                return 0
              }
              return prev - 1
            })
          }, 1000)
        }
      } else {
        addDebugLog("Email sent successfully")
        setResendMessage("Confirmation email sent! Please check your inbox.")
        setTimeLeft(60)
        const interval = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch (error) {
      addDebugLog("Fetch error: " + (error instanceof Error ? error.message : "Unknown error"))
      setResendError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsResending(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="max-w-sm mx-auto w-full">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Mail className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl text-center">Welcome to Noxy AI!</CardTitle>
                <CardDescription className="text-center">Check your email to confirm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You&apos;ve successfully signed up for Noxy AI. Please check your email to confirm your account before
                  signing in.
                </p>

                {resendMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-800">{resendMessage}</p>
                  </div>
                )}

                {resendError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{resendError}</p>
                    {timeLeft > 0 && <p className="text-xs text-red-700 mt-2">Try again in: {formatTime(timeLeft)}</p>}
                  </div>
                )}

                <Button onClick={handleResendConfirmation} disabled={isResending || timeLeft > 0} className="w-full">
                  {isResending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : "Resend Confirmation Email"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
