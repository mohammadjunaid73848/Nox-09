"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, Zap, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PLAN_PRICING } from "@/lib/payin"
import { PLAN_PRICING_USD } from "@/lib/config/env"
import { validatePromoCode } from "@/lib/promo-codes"

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
  const [promoCode, setPromoCode] = useState("")
  const [promoDiscount, setPromoDiscount] = useState<{ discount: number; isFree: boolean } | null>(null)
  const [promoError, setPromoError] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"payu" | "paypal">("paypal")
  const [currency, setCurrency] = useState<"INR" | "USD">("USD")

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((data) => {
        setIsPro(data.isPro)
      })
      .catch(console.error)
  }, [])

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setPromoDiscount(null)
      setPromoError("")
      return
    }

    const normalizedCode = promoCode.replace(/^@/, "").toUpperCase().trim()
    const promo = validatePromoCode(normalizedCode, selectedPlan === "monthly" ? "pro_monthly" : "pro_yearly")
    if (!promo) {
      setPromoError("Invalid promo code")
      setPromoDiscount(null)
      return
    }

    if (selectedPlan === "yearly" && promo.discountType === "free_tier") {
      setPromoDiscount({ discount: PLAN_PRICING.pro_yearly.amount / 100, isFree: true })
      setPromoError("")
    } else {
      setPromoError("This promo code is not applicable to the selected plan")
      setPromoDiscount(null)
    }
  }

  const handleSubscribe = async (planType: "pro_monthly" | "pro_yearly") => {
    setLoading(planType)
    try {
      const normalizedPromoCode = promoCode.replace(/^@/, "").toUpperCase().trim()
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          paymentMethod,
          promoCode: normalizedPromoCode || undefined,
        }),
      })

      const data = await res.json()

      if (data.paymentMethod === "paypal" && data.approvalUrl) {
        window.location.href = data.approvalUrl
      } else if (data.paymentUrl && data.formData) {
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
      } else if (data.error) {
        console.error("[v0] Subscription error:", data.error)
      }
    } catch (error) {
      console.error("[v0] Subscription error:", error)
    } finally {
      setLoading(null)
    }
  }

  const monthlyPrice = PLAN_PRICING_USD.pro_monthly.amount / 100
  const yearlyPrice = PLAN_PRICING_USD.pro_yearly.amount / 100
  const yearlySavings = monthlyPrice * 12 - yearlyPrice
  const currencySymbol = currency === "INR" ? "₹" : "$"

  return (
    <div className="min-h-screen bg-black text-white">
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
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-700 bg-neutral-900 mb-6">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono">SUPERNOXY PRO</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Unlock the Full Power of AI</h1>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Get access to all AI models, auto-select feature, and premium support with SuperNoxy Pro.
            </p>
          </div>

          <div className="mb-10 max-w-2xl mx-auto">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium">Payment Options</label>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-black/50 rounded-lg border border-amber-500/20">
                  <div>
                    <p className="font-medium text-amber-500">Pay with PayPal</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      International payments in USD. Recommended for global users.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-black/50 rounded-lg border border-neutral-700">
                  <div>
                    <p className="font-medium text-neutral-300">Alternative: UPI/Cards (India)</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      PayU recommended for Indian users. Available via separate link.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10 max-w-2xl mx-auto">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              <label className="block text-sm font-medium mb-3">Have a promo code?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value)
                    setPromoError("")
                  }}
                  className="flex-1 px-4 py-2 bg-black border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-red-500 text-sm mt-2">{promoError}</p>}
              {promoDiscount && (
                <p className="text-green-500 text-sm mt-2">
                  {promoDiscount.isFree
                    ? "✓ 1 Year Free!"
                    : `✓ ₹${promoDiscount.discount.toLocaleString("en-IN")} discount applied`}
                </p>
              )}
            </div>
          </div>

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

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 animate-fade-in">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Free</h3>
                <p className="text-neutral-400 text-sm">Get started with essential AI features</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{currencySymbol}0</span>
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

            <div
              className="relative bg-gradient-to-b from-amber-500/10 to-neutral-900/50 border border-amber-500/30 rounded-2xl p-8 animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" />
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
                  {currencySymbol}
                  {selectedPlan === "monthly"
                    ? monthlyPrice.toLocaleString(currency === "INR" ? "en-IN" : "en-US")
                    : yearlyPrice.toLocaleString(currency === "INR" ? "en-IN" : "en-US")}
                </span>
                <span className="text-neutral-400">/{selectedPlan === "monthly" ? "month" : "year"}</span>
                {currency === "USD" && (
                  <div className="text-xs text-neutral-500 mt-1">
                    ≈ ₹
                    {selectedPlan === "monthly"
                      ? (PLAN_PRICING.pro_monthly.amount / 100).toLocaleString("en-IN")
                      : (PLAN_PRICING.pro_yearly.amount / 100).toLocaleString("en-IN")}
                  </div>
                )}
                {currency === "INR" && (
                  <div className="text-xs text-neutral-500 mt-1">
                    ≈ $
                    {selectedPlan === "monthly"
                      ? (PLAN_PRICING_USD.pro_monthly.amount / 100).toFixed(2)
                      : (PLAN_PRICING_USD.pro_yearly.amount / 100).toFixed(2)}
                  </div>
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
                    Subscribe with {paymentMethod === "paypal" ? "PayPal" : "PayU"}
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
        </div>
      </main>
    </div>
  )
}
