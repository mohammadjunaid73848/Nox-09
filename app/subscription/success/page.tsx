"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Crown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const txnId = searchParams.get("txnid") || searchParams.get("subscription_id")
  const gateway = searchParams.get("gateway") || "payu"

  useEffect(() => {
    // Verify payment status
    const verifyPayment = async () => {
      try {
        const res = await fetch("/api/subscription/status")
        const data = await res.json()

        console.log("[v0] Subscription status check:", data)

        if (data.subscription?.status === "active") {
          setVerified(true)
        } else if (gateway === "paypal") {
          // Retry after additional delay
          setTimeout(async () => {
            const retryRes = await fetch("/api/subscription/status")
            const retryData = await retryRes.json()
            if (retryData.subscription?.status === "active") {
              setVerified(true)
            }
            setVerifying(false)
          }, 3000)
          return
        }
      } catch (error) {
        console.error("[v0] Verification error:", error)
      } finally {
        if (gateway !== "paypal") {
          setVerifying(false)
        }
      }
    }

    const delay = gateway === "paypal" ? 5000 : 2000
    setTimeout(verifyPayment, delay)
  }, [gateway])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {verifying ? (
          <div className="animate-fade-in">
            <Loader2 className="w-16 h-16 text-amber-500 mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Verifying Payment...</h1>
            <p className="text-neutral-400">
              {gateway === "paypal"
                ? "Processing your PayPal subscription. This may take a few moments."
                : "Please wait while we confirm your payment"}
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>

            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-neutral-400 mb-8">Welcome to SuperNoxy Pro! Your subscription is now active.</p>

            {txnId && (
              <div className="bg-neutral-900/50 rounded-lg p-4 mb-8 text-sm">
                <p className="text-neutral-500">{gateway === "paypal" ? "Subscription ID" : "Transaction ID"}</p>
                <p className="font-mono text-neutral-300 text-xs break-all">{txnId}</p>
                {gateway === "paypal" && <p className="text-xs text-neutral-500 mt-2">Gateway: PayPal</p>}
              </div>
            )}

            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
              <Crown className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <h2 className="font-semibold mb-2">Pro Features Unlocked</h2>
              <ul className="text-sm text-neutral-400 space-y-1">
                <li>All AI Models Access</li>
                <li>Unlimited Image Generation</li>
                <li>Priority Support</li>
                <li>Auto-Select Model Feature</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
                onClick={() => router.push("/chat")}
              >
                Start Chatting <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Link href="/subscription">
                <Button variant="outline" className="w-full border-neutral-700 bg-transparent">
                  View Subscription
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
