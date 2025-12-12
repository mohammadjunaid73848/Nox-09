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
  Clock,
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
  const [paying, setPaying] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get("status") === "success") {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }

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
    if (!confirm("Are you sure you want to cancel your subscription? Pro features will stop immediately.")) return

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

  const handlePayNow = async () => {
    setPaying(true)
    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: subscription?.plan_type || "pro_monthly" }),
      })
      const data = await res.json()

      if (data.success && data.paymentUrl && data.formData) {
        // Create and submit PayU form
        const form = document.createElement("form")
        form.method = "POST"
        form.action = data.paymentUrl

        Object.entries(data.formData).forEach(([key, value]) => {
          const input = document.createElement("input")
          input.type = "hidden"
          input.name = key
          input.value = value as string
          form.appendChild(input)
        })

        document.body.appendChild(form)
        form.submit()
      } else {
        alert(data.error || "Failed to initiate payment")
        setPaying(false)
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Failed to initiate payment")
      setPaying(false)
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

  const getGraceDaysRemaining = () => {
    if (!subscription?.payment_due_date) return 0
    const dueDate = new Date(subscription.payment_due_date)
    const now = new Date()
    const diffTime = dueDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const canCancelDuringGrace = () => {
    if (subscription?.status !== "payment_due") return false
    return getGraceDaysRemaining() > 0
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
            <AlertCircle className="w-3 h-3" /> Payment Due ({getGraceDaysRemaining()} days left)
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
    subscription &&
    ["pro_monthly", "pro_yearly"].includes(subscription.plan_type) &&
    (subscription.status === "active" || subscription.status === "payment_due")

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {showSuccess && (
        <div className="fixed top-0 left-0 right-0 bg-green-500 text-black py-3 px-4 text-center z-50 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 inline mr-2" />
          Payment successful! Your subscription is now active.
        </div>
      )}

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
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Subscription</h1>
            <p className="text-neutral-400">Manage your subscription and billing</p>
          </div>

          {subscription?.status === "payment_due" && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 animate-fade-in">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-500 mb-1">
                    Payment Due - {getGraceDaysRemaining()} Days Left
                  </h3>
                  <p className="text-sm text-neutral-300 mb-3">
                    Your billing cycle has renewed. Pay within {getGraceDaysRemaining()} days to continue Pro features,
                    or cancel to stop the subscription. No automatic charges will be made.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                      onClick={handlePayNow}
                      disabled={paying}
                    >
                      {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay Now"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10 bg-transparent"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    {subscription.status === "cancelled" || subscription.status === "expired"
                      ? "N/A"
                      : formatDate(subscription.next_billing_date)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {subscription?.status === "active" && isPro && (
                <Button
                  variant="outline"
                  className="border-red-500/50 text-red-500 hover:bg-red-500/10 bg-transparent"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Subscription"}
                </Button>
              )}
              {(!subscription ||
                subscription.status === "cancelled" ||
                subscription.status === "expired" ||
                subscription.plan_type === "free") && (
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

          {/* Billing Info Card */}
          <div
            className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-8 animate-fade-in"
            style={{ animationDelay: "50ms" }}
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              How Billing Works
            </h3>
            <ul className="text-sm text-neutral-400 space-y-2">
              <li>• Your subscription renews on the same date each month/year</li>
              <li>
                • When renewal is due, you have <strong className="text-white">3 days</strong> to pay or cancel
              </li>
              <li>• Pro features remain active during this 3-day grace period</li>
              <li>• If you cancel, Pro features stop immediately</li>
              <li>• If you don't pay within 3 days, subscription expires (no charges)</li>
              <li>• We never auto-charge - you must approve each payment</li>
            </ul>
          </div>

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

          {/* Refund Link */}
          <div className="mt-8 text-center">
            <Link href="/refund" className="text-sm text-neutral-500 hover:text-neutral-300 transition">
              View Refund Policy
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
