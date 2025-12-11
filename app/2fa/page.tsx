"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Shield, Mail, Loader2, AlertCircle, Clock } from "lucide-react"

export default function TwoFactorPage() {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState({
    attempts: 0,
    maxAttempts: 3,
    remaining: 3,
    blocked: false,
    resetTime: null as string | null,
  })
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const log = `[${timestamp}] ${message}`
    console.log(`[v0] ${log}`)
    setDebugLogs((prev) => [...prev.slice(-49), log]) // Keep last 50 logs
  }

  useEffect(() => {
    addDebugLog("2FA page mounted, checking auth...")
    checkAuth()
  }, [])

  useEffect(() => {
    if (!rateLimitInfo.blocked || !rateLimitInfo.resetTime) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const resetTime = new Date(rateLimitInfo.resetTime!).getTime()
      const remaining = Math.max(0, Math.floor((resetTime - now) / 1000))

      setTimeRemaining(remaining)

      if (remaining === 0) {
        setRateLimitInfo({ ...rateLimitInfo, blocked: false })
        addDebugLog("Rate limit block expired")
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [rateLimitInfo])

  const checkAuth = async () => {
    addDebugLog("Checking user authentication...")
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      addDebugLog("No user found, redirecting to login")
      router.push("/auth/login")
      return
    }

    addDebugLog(`User authenticated: ${user.email}`)
    setUser(user)

    const { data: settings, error: settingsError } = await supabase
      .from("user_2fa_settings")
      .select("enabled")
      .eq("user_id", user.id)
      .single()

    if (settingsError) {
      addDebugLog(`Error checking 2FA settings: ${settingsError.message}`)
    }

    if (!settings || !settings.enabled) {
      addDebugLog("2FA not enabled, redirecting to chat")
      router.push("/chat")
    } else {
      addDebugLog("2FA is enabled for this user")
      const isVerified = localStorage.getItem(`2fa_verified_${user.id}`)
      if (isVerified === "true") {
        addDebugLog("2FA already verified, redirecting to chat")
        router.push("/chat")
      } else {
        addDebugLog("Checking rate limit...")
        await checkRateLimit()
      }
    }
  }

  const checkRateLimit = async () => {
    try {
      addDebugLog("Calling /api/check-rate-limit...")
      const response = await fetch("/api/check-rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          actionType: "send_otp_2fa",
        }),
      })
      const data = await response.json()

      if (response.status === 429) {
        addDebugLog(`Rate limit blocked: remaining=${data.remaining}, reset=${data.resetTime}`)
        setRateLimitInfo({
          attempts: data.attempts || 3,
          maxAttempts: 3,
          remaining: data.remaining || 0,
          blocked: true,
          resetTime: data.resetTime,
        })
      } else {
        addDebugLog(`Rate limit OK: attempts=${data.attempts}, remaining=${data.remaining}`)
        setRateLimitInfo({
          attempts: data.attempts || 0,
          maxAttempts: 3,
          remaining: data.remaining || 3,
          blocked: false,
          resetTime: null,
        })
      }
    } catch (error) {
      addDebugLog(`Error checking rate limit: ${error instanceof Error ? error.message : String(error)}`)
      // Default to allowing if check fails
      setRateLimitInfo({
        attempts: 0,
        maxAttempts: 3,
        remaining: 3,
        blocked: false,
        resetTime: null,
      })
    }
  }

  const handleSendOtp = async () => {
    addDebugLog("Send OTP button clicked")

    if (rateLimitInfo.blocked) {
      addDebugLog("Rate limit is active, cannot send OTP")
      const hours = Math.ceil((timeRemaining || 0) / 3600)
      toast({
        title: "Rate Limited",
        description: `Too many attempts. Try again in ${hours} hour(s).`,
        variant: "destructive",
      })
      return
    }

    setSendingOtp(true)
    addDebugLog("Calling /api/send-otp...")

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      addDebugLog(`API response status: ${response.status}`)
      const data = await response.json()
      addDebugLog(`API response: ${JSON.stringify(data)}`)

      if (response.ok) {
        setOtpSent(true)
        addDebugLog("OTP sent successfully")
        toast({
          title: "✓ OTP Sent Successfully",
          description: "Check your email for the verification code",
        })
        await checkRateLimit()
      } else {
        addDebugLog(`Failed to send OTP: ${data.error}`)
        toast({
          title: "Error",
          description: data.error || "Failed to send OTP",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      addDebugLog(`Error sending OTP: ${errorMsg}`)
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    addDebugLog(`Verify OTP button clicked with code: ${otp}`)

    if (otp.length !== 6) {
      addDebugLog("Invalid code length")
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp }),
      })

      addDebugLog(`Verify API response status: ${response.status}`)
      const data = await response.json()
      addDebugLog(`Verify API response: ${JSON.stringify(data)}`)

      if (response.ok) {
        if (user) {
          localStorage.setItem(`2fa_verified_${user.id}`, "true")
          addDebugLog("2FA verification successful, saved to localStorage")
        }

        toast({
          title: "✓ Verification Successful",
          description: "Redirecting to chat...",
        })

        setTimeout(() => {
          router.push("/chat")
        }, 1000)
      } else {
        addDebugLog(`Verification failed: ${data.error}`)
        toast({
          title: "Verification Failed",
          description: data.error || "Invalid or expired code",
          variant: "destructive",
        })
        setOtp("")
        await checkRateLimit()
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      addDebugLog(`Error verifying OTP: ${errorMsg}`)
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return ""
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
            <CardDescription>Enter the verification code sent to your email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="text-sm text-muted-foreground text-center mb-4">
                Verification code will be sent to:
                <br />
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
            )}

            {rateLimitInfo.remaining < 3 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Attempts remaining: {rateLimitInfo.remaining}/3</p>
                </div>
              </div>
            )}

            {rateLimitInfo.blocked && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                <Clock className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Too many attempts</p>
                  <p className="text-xs mt-1">Try again in: {formatTime(timeRemaining)}</p>
                </div>
              </div>
            )}

            {!otpSent ? (
              <Button
                onClick={handleSendOtp}
                disabled={sendingOtp || rateLimitInfo.blocked}
                className="w-full"
                size="lg"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Verification Code
                  </>
                )}
              </Button>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                    autoFocus
                    disabled={rateLimitInfo.blocked}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6 || rateLimitInfo.blocked}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || rateLimitInfo.blocked}
                  className="w-full"
                >
                  {sendingOtp ? "Sending..." : "Resend Code"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
