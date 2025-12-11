"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, Zap, ArrowLeft, Loader2, Crown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PLAN_PRICING } from "@/lib/payin"

const features = {
  free: [
    "NVIDIA DeepSeek R1 (Unlimited)",
    "2 Cerebras Models (Qwen-3-32B, GPT-OSS-120B)",
    "Unlimited Image Generation",
    "Basic Chat History",
    "Community Support",
  ],
  pro: [
    "All Free Features",
    "All AI Models Access",
    "Auto-Select Model (Recommended)",
    "Priority Response Times",
    "Advanced Reasoning Models",
    "Coding Specialist Models",
    "Extended Chat History",
    "Priority Support",
  ],
}

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly")

  useEffect(() => {
    // Check subscription status
    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((data) => {
        setIsPro(data.isPro)
      })
      .catch(console.error)
  }, [])

  const handleSubscribe = async (planType: "pro_monthly" | "pro_yearly") => {
    setLoading(planType)
    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      })

      const data = await res.json()

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else if (data.error) {
        alert(data.error)
      }
    } catch (error) {
      console.error("Subscription error:", error)
      alert("Failed to create subscription")
    } finally {
      setLoading(null)
    }
  }

  const monthlyPrice = PLAN_PRICING.pro_monthly.amount / 100
  const yearlyPrice = PLAN_PRICING.pro_yearly.amount / 100
  const yearlySavings = monthlyPrice * 12 - yearlyPrice

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <img src="https://www.noxyai.com/logo-black.png" alt="Noxyai" className="w-8 h-8 invert" />
            <span className="font-semibold text-xl">Noxyai</span>
          </Link>
          <div className="w-20" />
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-700 bg-neutral-900 mb-6">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono">SUPERNOXY PRO</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Unlock the Full Power of AI</h1>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Get access to all AI models, auto-select feature, and premium support with SuperNoxy Pro.
            </p>
          </div>

          {/* Plan Toggle */}
          <div className="flex justify-center mb-10">
            <div className="bg-neutral-900 p-1 rounded-full inline-flex">
              <button
                onClick={() => setSelectedPlan("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedPlan === "monthly" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPlan("yearly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedPlan === "yearly" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                Yearly
                <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                  Save ₹{yearlySavings.toLocaleString("en-IN")}
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 animate-fade-in">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Free</h3>
                <p className="text-neutral-400 text-sm">Get started with essential AI features</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-neutral-400">/forever</span>
              </div>

              <Button
                variant="outline"
                className="w-full mb-8 border-neutral-700 hover:bg-neutral-800 bg-transparent"
                disabled
              >
                Current Plan
              </Button>

              <ul className="space-y-3">
                {features.free.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div
              className="relative bg-gradient-to-b from-amber-500/10 to-neutral-900/50 border border-amber-500/30 rounded-2xl p-8 animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  RECOMMENDED
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  SuperNoxy Pro
                  <Zap className="w-5 h-5 text-amber-500" />
                </h3>
                <p className="text-neutral-400 text-sm">Full access to all AI capabilities</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ₹
                  {selectedPlan === "monthly"
                    ? monthlyPrice.toLocaleString("en-IN")
                    : yearlyPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-neutral-400">/{selectedPlan === "monthly" ? "month" : "year"}</span>
                {selectedPlan === "yearly" && (
                  <p className="text-sm text-green-500 mt-1">
                    ₹{Math.round(yearlyPrice / 12).toLocaleString("en-IN")}/month billed annually
                  </p>
                )}
              </div>

              <Button
                className="w-full mb-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
                onClick={() => handleSubscribe(selectedPlan === "monthly" ? "pro_monthly" : "pro_yearly")}
                disabled={loading !== null || isPro}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPro ? (
                  "Already Subscribed"
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Subscribe Now
                  </>
                )}
              </Button>

              <ul className="space-y-3">
                {features.pro.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-200">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">Frequently Asked Questions</h2>

            <div className="space-y-4">
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                <h3 className="font-medium mb-2">What payment methods are accepted?</h3>
                <p className="text-sm text-neutral-400">
                  We accept UPI, Credit/Debit Cards, Net Banking, and all major payment methods available in India.
                </p>
              </div>

              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                <h3 className="font-medium mb-2">How does autopay work?</h3>
                <p className="text-sm text-neutral-400">
                  With autopay enabled, your subscription renews automatically. You'll receive a reminder 24 hours
                  before billing, with a 3-day grace period if payment fails.
                </p>
              </div>

              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                <h3 className="font-medium mb-2">Can I cancel anytime?</h3>
                <p className="text-sm text-neutral-400">
                  Yes! You can cancel your subscription at any time. You'll continue to have access until the end of
                  your billing period.
                </p>
              </div>

              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                <h3 className="font-medium mb-2">What happens to my data if I cancel?</h3>
                <p className="text-sm text-neutral-400">
                  Your chat history and data remain intact. You'll just lose access to Pro features and models.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
