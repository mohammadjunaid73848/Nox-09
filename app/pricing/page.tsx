"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, Zap, ArrowLeft, Loader2, Crown, Sparkles, X, AlertCircle, CheckCircle } from "lucide-react"
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
  const [paymentMethod, setPaymentMethod] = useState<"payu" | "paypal">("payu")
  const [currency, setCurrency] = useState<"INR" | "USD">("INR")
  const [showDebugPanel, setShowDebugPanel] = useState(true)
  const [configStatus, setConfigStatus] = useState<any>(null)
  const [paypalClientId, setPaypalClientId] = useState<string>("")
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const paypalButtonRefs = useRef<{ monthly: HTMLDivElement | null; yearly: HTMLDivElement | null }>({
    monthly: null,
    yearly: null,
  })

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((data) => {
        setIsPro(data.isPro)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetch("/api/config/status")
      .then((res) => res.json())
      .then((data) => setConfigStatus(data))
      .catch((err) => console.error("[v0] Config fetch error:", err))
  }, [])

  useEffect(() => {
    if (paymentMethod === "paypal" && !paypalLoaded) {
      const clientId = "ATGX8qWGVURXSYk4a_rCeBABItvVD6O-LOqKWRGGLAw5VA0R_ttM_kZeCG97PNn6YTiGQCjbLaqXhTtO"
      const script = document.createElement("script")
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`
      script.addEventListener("load", () => {
        setPaypalLoaded(true)
        console.log("[v0] PayPal SDK loaded successfully")
      })
      script.addEventListener("error", () => {
        console.error("[v0] Failed to load PayPal SDK")
        setErrorModal({
          title: "PayPal Loading Error",
          message: "Failed to load PayPal. Please refresh the page and try again.",
        })
      })
      document.body.appendChild(script)
    }
  }, [paymentMethod, paypalLoaded])

  useEffect(() => {
    if (paypalLoaded && paymentMethod === "paypal" && (window as any).paypal) {
      const planId = selectedPlan === "monthly" ? "P-2E389376EP025560JNE7G7VI" : "P-3UA6156419729621GNE7HLYY"
      const containerRef = paypalButtonRefs.current[selectedPlan]

      if (containerRef && !containerRef.hasChildNodes()) {
        ;(window as any).paypal
          .Buttons({
            style: {
              shape: "rect",
              color: "gold",
              layout: "vertical",
              label: "subscribe",
            },
            createSubscription: async (data: any, actions: any) => {
              // Fetch user ID from server to include in subscription
              const userRes = await fetch("/api/subscription/status")
              const userData = await userRes.json()

              return actions.subscription.create({
                plan_id: planId,
                custom_id: userData.userId || "guest", // Pass user ID for webhook
              })
            },
            onApprove: async (data: any) => {
              console.log("[v0] PayPal subscription approved:", data.subscriptionID)
              // Redirect to success page - webhook will activate subscription
              router.push(`/subscription/success?subscription_id=${data.subscriptionID}&gateway=paypal`)
            },
            onCancel: () => {
              console.log("[v0] PayPal subscription cancelled by user")
              setErrorModal({
                title: "Subscription Cancelled",
                message: "You cancelled the PayPal subscription. No charges were made.",
              })
            },
            onError: (err: any) => {
              console.error("[v0] PayPal button error:", err)
              setErrorModal({
                title: "PayPal Error",
                message: "Failed to process PayPal subscription. Please try again or contact support.",
              })
            },
          })
          .render(containerRef)
          .catch((err: any) => {
            console.error("[v0] PayPal render error:", err)
          })
      }
    }
  }, [paypalLoaded, paymentMethod, selectedPlan, router])

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
          autoPayEnabled: !!autoPayMethod,
          autoPayMethod,
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

      {showDebugPanel && configStatus && (
        <div className="fixed top-20 left-0 right-0 z-40 mx-4 max-w-4xl lg:mx-auto">
          <div className="bg-gradient-to-br from-orange-900/90 to-red-900/90 backdrop-blur-lg border border-orange-500/50 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-orange-500/30">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-300" />
                <h3 className="font-semibold text-white">Payment Gateway Debug Panel</h3>
              </div>
              <button
                onClick={() => setShowDebugPanel(false)}
                className="text-orange-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {configStatus.raw && (
                <div className="mb-4 p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                  <h5 className="font-semibold text-purple-300 mb-2 text-sm">Raw Environment Detection</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">PAYPAL_CLIENT_ID detected:</span>
                      <span className={configStatus.raw.hasPaypalClientId ? "text-green-400" : "text-red-400"}>
                        {configStatus.raw.hasPaypalClientId ? "✓ Yes" : "✗ No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Length:</span>
                      <span className="text-blue-400">{configStatus.raw.paypalClientIdLength} chars</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">PAYPAL_CLIENT_SECRET detected:</span>
                      <span className={configStatus.raw.hasPaypalClientSecret ? "text-green-400" : "text-red-400"}>
                        {configStatus.raw.hasPaypalClientSecret ? "✓ Yes" : "✗ No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Length:</span>
                      <span className="text-blue-400">{configStatus.raw.paypalClientSecretLength} chars</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-purple-500/20">
                    <p className="text-xs text-purple-200">
                      Environment: <span className="text-blue-400">{configStatus.environment}</span> | Timestamp:{" "}
                      <span className="text-blue-400">{new Date(configStatus.timestamp).toLocaleTimeString()}</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/40 rounded-lg p-4 border border-orange-500/20">
                  <h4 className="font-semibold text-orange-300 mb-3 flex items-center gap-2">
                    {configStatus.payu?.isConfigured ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    PayU (INR) Configuration
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">PAYU_KEY:</span>
                      <span className={configStatus.payu?.key ? "text-green-400" : "text-red-400"}>
                        {configStatus.payu?.key ? `${configStatus.payu.key.substring(0, 8)}...` : "❌ Missing"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">PAYU_SALT:</span>
                      <span className={configStatus.payu?.salt ? "text-green-400" : "text-red-400"}>
                        {configStatus.payu?.salt ? `${configStatus.payu.salt.substring(0, 8)}...` : "❌ Missing"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">PAYU_BASE_URL:</span>
                      <span className="text-blue-400 text-xs break-all">{configStatus.payu?.baseUrl || "Not set"}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-orange-500/20">
                      <span className="text-xs font-medium">
                        Status:{" "}
                        {configStatus.payu?.isConfigured ? (
                          <span className="text-green-400">✓ Ready</span>
                        ) : (
                          <span className="text-red-400">✗ Not Configured</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 rounded-lg p-4 border border-orange-500/20">
                  <h4 className="font-semibold text-orange-300 mb-3 flex items-center gap-2">
                    {configStatus.paypal?.isConfigured ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    PayPal (USD) Configuration
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">PAYPAL_CLIENT_ID:</span>
                      <span className={configStatus.paypal?.clientId ? "text-green-400" : "text-red-400"}>
                        {configStatus.paypal?.clientId
                          ? `${configStatus.paypal.clientId.substring(0, 8)}...`
                          : "❌ Missing"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">PAYPAL_CLIENT_SECRET:</span>
                      <span className={configStatus.paypal?.clientSecret ? "text-green-400" : "text-red-400"}>
                        {configStatus.paypal?.clientSecret
                          ? `${configStatus.paypal.clientSecret.substring(0, 8)}...`
                          : "❌ Missing"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">PAYPAL_BASE_URL:</span>
                      <span className="text-blue-400 text-xs break-all">
                        {configStatus.paypal?.baseUrl || "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">PAYPAL_WEBHOOK_ID:</span>
                      <span className={configStatus.paypal?.webhookId ? "text-green-400" : "text-yellow-400"}>
                        {configStatus.paypal?.webhookId
                          ? `${configStatus.paypal.webhookId.substring(0, 8)}...`
                          : "⚠️ Optional"}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-orange-500/20">
                      <span className="text-xs font-medium">
                        Status:{" "}
                        {configStatus.paypal?.isConfigured ? (
                          <span className="text-green-400">✓ Ready</span>
                        ) : (
                          <span className="text-red-400">✗ Not Configured</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {(!configStatus.payu?.isConfigured || !configStatus.paypal?.isConfigured) && (
                <div className="mt-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
                  <h5 className="font-semibold text-red-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Configuration Issues Detected
                  </h5>
                  <ul className="text-sm text-red-200 space-y-1 list-disc list-inside">
                    {!configStatus.payu?.isConfigured && (
                      <li>PayU is not configured. Add PAYU_KEY and PAYU_SALT to environment variables.</li>
                    )}
                    {!configStatus.paypal?.isConfigured && (
                      <li>
                        PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to environment
                        variables.
                      </li>
                    )}
                  </ul>
                  <div className="mt-3 p-3 bg-black/40 rounded border border-orange-500/20">
                    <p className="text-xs text-orange-200 mb-2 font-medium">
                      {configStatus.raw?.hasPaypalClientId || configStatus.raw?.hasPaypalClientSecret
                        ? "⚠️ Variables detected but not loading properly:"
                        : "How to add environment variables:"}
                    </p>
                    <ol className="text-xs text-neutral-300 space-y-1 list-decimal list-inside">
                      <li>Open v0 Settings (left sidebar)</li>
                      <li>Navigate to "Vars" section</li>
                      <li>Click "Add Variable" for each missing one</li>
                      <li>Ensure no extra spaces or quotes in values</li>
                      <li>Save and refresh the page</li>
                      {(configStatus.raw?.hasPaypalClientId || configStatus.raw?.hasPaypalClientSecret) && (
                        <li className="text-yellow-300 font-medium">
                          If variables show as detected but still not working, try redeploying or restarting the server
                        </li>
                      )}
                    </ol>
                  </div>
                </div>
              )}

              {configStatus.payu?.isConfigured && configStatus.paypal?.isConfigured && (
                <div className="mt-4 p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                  <h5 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    All Payment Gateways Configured Successfully
                  </h5>
                  <p className="text-sm text-green-200">
                    Both PayU (INR) and PayPal (USD) are properly configured and ready to process payments.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!showDebugPanel && (
        <button
          onClick={() => setShowDebugPanel(true)}
          className="fixed top-20 right-4 z-40 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg shadow-lg transition-colors flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          Show Debug Panel
        </button>
      )}

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
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

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800 relative overflow-hidden">
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
              className="relative bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-2xl p-8 border-2 border-amber-500/50 relative overflow-hidden"
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

              {paymentMethod === "paypal" && (
                <div className="mb-8">
                  <div className="space-y-4">
                    {!paypalLoaded ? (
                      <div className="flex items-center justify-center gap-3 py-8 text-neutral-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading PayPal...</span>
                      </div>
                    ) : (
                      <>
                        {selectedPlan === "monthly" && (
                          <div ref={(el) => (paypalButtonRefs.current.monthly = el)} className="min-h-[150px]" />
                        )}
                        {selectedPlan === "yearly" && (
                          <div ref={(el) => (paypalButtonRefs.current.yearly = el)} className="min-h-[150px]" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

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
