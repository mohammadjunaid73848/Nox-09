"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, Zap, ArrowLeft, Loader2, Crown, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PLAN_PRICING } from "@/lib/payin"
import { PLAN_PRICING_USD } from "@/lib/paypal"
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
  const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null)
  const [promoCode, setPromoCode] = useState("")
  const [promoDiscount, setPromoDiscount] = useState<{ discount: number; isFree: boolean } | null>(null)
  const [promoError, setPromoError] = useState("")
  const [autoPayMethod, setAutoPayMethod] = useState<"upi" | "card" | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"payu" | "paypal">("payu") // Add payment method state
  const [currency, setCurrency] = useState<"INR" | "USD">("INR") // Add currency state

  useEffect(() => {
    // Check subscription status
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
          paymentMethod, // Send payment method
          promoCode: normalizedPromoCode || undefined,
          autoPayEnabled: !!autoPayMethod,
          autoPayMethod,
        }),
      })

      const data = await res.json()

      if (data.paymentMethod === "paypal" && data.approvalUrl) {
        // Redirect to PayPal for approval
        window.location.href = data.approvalUrl
      } else if (data.paymentUrl && data.formData) {
        // Create a form dynamically and submit it (PayU)
        const form = document.createElement("form")
        form.method = "POST"
        form.action = data.paymentUrl

        // Add all form fields
        Object.entries(data.formData).forEach(([key, value]) => {
          const input = document.createElement("input")
          input.type = "hidden"
          input.name = key
          input.value = value as string
          form.appendChild(input)
        })

        document.body.appendChild(form)
        console.log("[v0] Submitting PayU form with data:", data.formData)
        form.submit()
      } else if (data.error) {
        setErrorModal({
          title: "Payment Gateway Connection Failed",
          message: data.error,
        })
        setLoading(null)
      }
    } catch (error) {
      console.error("[v0] Subscription error:", error)
      setErrorModal({
        title: "Connection Error",
        message: "Failed to process your subscription. Please check your internet connection and try again.",
      })
      setLoading(null)
    }
  }

  const monthlyPrice =
    currency === "INR" ? PLAN_PRICING.pro_monthly.amount / 100 : PLAN_PRICING_USD.pro_monthly.amount / 100
  const yearlyPrice =
    currency === "INR" ? PLAN_PRICING.pro_yearly.amount / 100 : PLAN_PRICING_USD.pro_yearly.amount / 100
  const yearlySavings = monthlyPrice * 12 - yearlyPrice
  const currencySymbol = currency === "INR" ? "₹" : "$"

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

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-black">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">{errorModal.title}</h3>
              <button
                onClick={() => setErrorModal(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">{errorModal.message}</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setErrorModal(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setErrorModal(null)
                  window.open("https://www.noxyai.com/contact", "_blank")
                }}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      )}

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

          <div className="mb-10 max-w-2xl mx-auto">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              <label className="block text-sm font-medium mb-4">Select Currency & Payment Method</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-2">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => {
                      const newCurrency = e.target.value as "INR" | "USD"
                      setCurrency(newCurrency)
                      // Auto-select payment method based on currency
                      setPaymentMethod(newCurrency === "USD" ? "paypal" : "payu")
                    }}
                    className="w-full px-4 py-2 bg-black border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-2">Payment Gateway</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as "payu" | "paypal")}
                    className="w-full px-4 py-2 bg-black border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="payu">PayU (INR)</option>
                    <option value="paypal">PayPal (USD)</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-neutral-400 mt-3">
                {currency === "INR"
                  ? "PayU supports UPI, Cards, Net Banking, and Wallets for INR payments."
                  : "PayPal supports international payments in USD. ~83 INR = 1 USD"}
              </p>
            </div>
          </div>

          {/* Promo Code Input Section */}
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
                  {currencySymbol}
                  {selectedPlan === "monthly"
                    ? monthlyPrice.toLocaleString(currency === "INR" ? "en-IN" : "en-US")
                    : yearlyPrice.toLocaleString(currency === "INR" ? "en-IN" : "en-US")}
                </span>
                <span className="text-neutral-400">/{selectedPlan === "monthly" ? "month" : "year"}</span>
                {/* Show equivalent in other currency */}
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

          {/* Auto-Pay Method Selection */}
          {selectedPlan === "yearly" && !promoDiscount?.isFree && (
            <div className="mb-10 max-w-2xl mx-auto">
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                <label className="block text-sm font-medium mb-4">Enable Auto-Pay (Optional)</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="autopay"
                      value="upi"
                      checked={autoPayMethod === "upi"}
                      onChange={(e) => setAutoPayMethod(e.target.value as "upi")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">UPI Auto-Pay (Recommended)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="autopay"
                      value="card"
                      checked={autoPayMethod === "card"}
                      onChange={(e) => setAutoPayMethod(e.target.value as "card")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Debit/Credit Card</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="autopay"
                      value=""
                      checked={autoPayMethod === null}
                      onChange={() => setAutoPayMethod(null)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Manual Payment (Pay when reminded)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

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
