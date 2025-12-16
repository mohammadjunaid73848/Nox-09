import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Shield } from "lucide-react"

export const metadata = {
  title: "Ownership - Noxy AI",
  description: "Ownership information for Noxy AI",
}

export default function OwnershipPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/5 bg-black/80">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Ownership Information</h1>
          </div>
          <p className="text-gray-400">Official ownership and founding details</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-lg p-8">
            <h2 className="text-3xl font-bold mb-6 text-primary">Noxy AI Ownership</h2>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Owner
                </h3>
                <p className="text-2xl font-bold text-white">RUHEE JAN</p>
                <p className="text-gray-400 mt-2">Owner of www.noxyai.com</p>
              </div>

              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Founder
                </h3>
                <p className="text-2xl font-bold text-white">Mohammad Junaid Rather</p>
                <p className="text-gray-400 mt-2">Founder of Noxy AI</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-sm text-gray-400">
                This information is provided for verification and transparency purposes. For any inquiries regarding
                ownership, please contact support@noxyai.com
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
