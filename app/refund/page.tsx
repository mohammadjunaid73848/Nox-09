import Link from "next/link"
import { ArrowLeft, Mail, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Refund Policy - Noxyai",
  description: "Noxyai refund policy and cancellation guidelines",
}

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-black/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <img src="https://www.noxyai.com/logo-black.png" alt="Noxyai" className="w-8 h-8 invert" />
          </Link>
          <div className="w-20" />
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
          <p className="text-neutral-400 mb-8">Last updated: December 2024</p>

          {/* Important Notice */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-500 mb-2">Important Notice</h3>
                <p className="text-neutral-300">
                  Refund requests must be submitted within <strong>7 days</strong> of the payment date. Please email us
                  at{" "}
                  <a href="mailto:support@noxyai.com" className="text-amber-500 underline">
                    support@noxyai.com
                  </a>{" "}
                  with your transaction details.
                </p>
              </div>
            </div>
          </div>

          {/* When Refund Applies */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">When Refund Applies</h2>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Payment Deducted But Service Not Activated</p>
                  <p className="text-sm text-neutral-400">
                    If your payment was processed but your subscription was not activated due to technical issues.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Double/Multiple Charges</p>
                  <p className="text-sm text-neutral-400">
                    If you were charged multiple times for the same subscription period.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Service Unavailable</p>
                  <p className="text-sm text-neutral-400">
                    If our service was significantly unavailable during your subscription period.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How to Request Refund */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">How to Request a Refund</h2>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Email Us</p>
                    <p className="text-sm text-neutral-400">
                      Send an email to{" "}
                      <a href="mailto:support@noxyai.com" className="text-amber-500 underline">
                        support@noxyai.com
                      </a>{" "}
                      with subject "Refund Request"
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Include Transaction Details</p>
                    <p className="text-sm text-neutral-400">
                      Your registered email, transaction ID, payment date, and amount paid.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Describe the Issue</p>
                    <p className="text-sm text-neutral-400">
                      Explain why you're requesting a refund with any relevant screenshots.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    4
                  </span>
                  <div>
                    <p className="font-medium">Wait for Response</p>
                    <p className="text-sm text-neutral-400">
                      We will review your request and respond within 3-5 business days.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </section>

          {/* Billing Cycle */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Billing & Cancellation</h2>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">3-Day Grace Period</p>
                  <p className="text-sm text-neutral-400">
                    When your next billing cycle begins, you have 3 days to pay or cancel your subscription. For
                    example, if you subscribed on the 12th, your next bill will be on the 12th of the following month.
                    You can pay or cancel within the 12th, 13th, or 14th.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Pro Features During Grace Period</p>
                  <p className="text-sm text-neutral-400">
                    Your Pro features remain active during the 3-day grace period. If you cancel, Pro features will stop
                    immediately. If you don't pay within 3 days, your subscription will automatically expire without any
                    additional charges.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">No Automatic Charges</p>
                  <p className="text-sm text-neutral-400">
                    We do not automatically charge your card. You will receive a notification when your bill is due and
                    must manually approve the payment.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-amber-500" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <a href="mailto:support@noxyai.com" className="text-amber-500">
                    support@noxyai.com
                  </a>
                </div>
              </div>
              <p className="text-sm text-neutral-400">
                For all refund-related queries, please email us within 7 days of your payment. Include your transaction
                ID and registered email address for faster processing.
              </p>
            </div>
          </section>

          <div className="text-center">
            <Link href="/subscription">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold">
                Manage Subscription
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
