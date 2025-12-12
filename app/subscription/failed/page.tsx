"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { XCircle, ArrowLeft, RefreshCw, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const txnId = searchParams.get("txnid")
  const errorMsg = searchParams.get("error")

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
        <p className="text-neutral-400 mb-8">
          We couldn't process your payment. Don't worry, no money has been deducted.
        </p>

        {txnId && (
          <div className="bg-neutral-900/50 rounded-lg p-4 mb-4 text-sm">
            <p className="text-neutral-500">Transaction ID</p>
            <p className="font-mono text-neutral-300">{txnId}</p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8 text-sm">
            <p className="text-red-400">{decodeURIComponent(errorMsg)}</p>
          </div>
        )}

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold mb-3">Common reasons for failure:</h3>
          <ul className="text-sm text-neutral-400 space-y-2">
            <li>• Insufficient funds in your account</li>
            <li>• Card declined by bank</li>
            <li>• Incorrect card details</li>
            <li>• Transaction timeout</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link href="/pricing">
            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold">
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="outline" className="w-full border-neutral-700 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Chat
            </Button>
          </Link>
          <a href="mailto:support@noxyai.com">
            <Button variant="ghost" className="w-full text-neutral-400">
              <Mail className="w-4 h-4 mr-2" /> Contact Support
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
