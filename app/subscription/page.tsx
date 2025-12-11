"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Crown,
  Zap,
  Calendar,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Subscription, PaymentHistory } from "@/lib/subscription-types"

export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Check for success status from payment redirect
    if (searchParams.get("status") === "success") {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }

    // Fetch subscription status
    Promise.all([
      fetch("/api/subscription/status").then((r) => r.json()),
      fetch("/api/subscription/history")
        .then((r) => r.json())
        .catch(() => ({ payments: [] })),
    ])
      .then(([subData, historyData]) => {
        setSubscription(subData.subscription)
        setPayments(historyData.payments || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [searchParams])

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return

    setCancelling(true)
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" })
      const data = await res.json()

      if (data.success) {
        setSubscription((prev) => (prev ? { ...prev, status: "cancelled" } : null))
      } else {
        alert(data.error || "Failed to cancel subscription")
      }
    } catch (error) {
      console.error("Cancel error:", error)
      alert("Failed to cancel subscription")
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatAmount = (paisa: number) => {
    return `₹${(paisa / 100).toLocaleString("en-IN")}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-full text-xs">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        )
      case "cancelled":
        return (
          <span className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-full text-xs">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        )
      case "payment_due":
        return (
          <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full text-xs">
            <AlertCircle className="w-3 h-3" /> Payment Due
          </span>
        )
      case "expired":
        return (
          <span className="flex items-center gap-1 text-neutral-500 bg-neutral-500/10 px-2 py-1 rounded-full text-xs">
            <XCircle className="w-3 h-3" /> Expired
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 text-neutral-500 bg-neutral-500/10 px-2 py-1 rounded-full text-xs">
            {status}
          </span>
        )
    }
  }

  const isPro =
    subscription && ["pro_monthly", "pro_yearly"].includes(subscription.plan_type) && subscription.status === "active"

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Success Banner */}
      {showSuccess && (
        <div className="fixed top-0 left-0 right-0 bg-green-500 text-black py-3 px-4 text-center z-50 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 inline mr-2" />
          Payment successful! Your subscription is now active.
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-black/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Chat</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <img src="https://www.noxyai.com/logo-black.png" alt="Noxyai" className="w-8 h-8 invert" />
          </Link>
          <div className="w-32" />
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Current Plan */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Subscription</h1>
            <p className="text-neutral-400">Manage your subscription and billing</p>
          </div>

          {/* Plan Card */}
          <div
            className={`rounded-2xl p-6 mb-8 border animate-fade-in ${
              isPro
                ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30"
                : "bg-neutral-900/50 border-neutral-800"
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {isPro ? <Crown className="w-6 h-6 text-amber-500" /> : <Zap className="w-6 h-6 text-neutral-500" />}
                  <h2 className="text-xl font-semibold">
                    {subscription?.plan_type === "pro_monthly"
                      ? "SuperNoxy Pro Monthly"
                      : subscription?.plan_type === "pro_yearly"
                        ? "SuperNoxy Pro Yearly"
                        : "Free Plan"}
                  </h2>
                </div>
                {subscription && getStatusBadge(subscription.status)}
              </div>

              {subscription?.amount_inr && (
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatAmount(subscription.amount_inr)}</p>
                  <p className="text-sm text-neutral-400">
                    /{subscription.plan_type === "pro_yearly" ? "year" : "month"}
                  </p>
                </div>
              )}
            </div>

            {subscription && subscription.plan_type !== "free" && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Current Period
                  </div>
                  <p className="font-medium">
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </p>
                </div>

                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                    <CreditCard className="w-4 h-4" />
                    Next Billing
                  </div>
                  <p className="font-medium">
                    {subscription.status === "cancelled" ? "N/A" : formatDate(subscription.next_billing_date)}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {isPro ? (
                <>
                  <Button
                    variant="outline"
                    className="border-red-500/50 text-red-500 hover:bg-red-500/10 bg-transparent"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Subscription"}
                  </Button>
                </>
              ) : (
                <Button
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
                  onClick={() => router.push("/pricing")}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h3 className="text-lg font-semibold mb-4">Payment History</h3>

            {payments.length === 0 ? (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 text-center">
                <CreditCard className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">No payment history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          payment.status === "success"
                            ? "bg-green-500/10 text-green-500"
                            : payment.status === "failed"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-neutral-500/10 text-neutral-500"
                        }`}
                      >
                        {payment.status === "success" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : payment.status === "failed" ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          <Loader2 className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{formatAmount(payment.amount_inr)}</p>
                        <p className="text-sm text-neutral-400">
                          {formatDate(payment.created_at)} • {payment.payment_method || "Card"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
