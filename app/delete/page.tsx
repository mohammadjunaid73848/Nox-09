"use client"
import { AlertCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function DeletedAccountPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-red-200 dark:border-red-900">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Blocked</h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Your account has been blocked or deleted</p>
            </div>

            {/* Message */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                If you believe this is a mistake or have any questions about your account status, please contact our
                support team.
              </p>
            </div>

            {/* Contact Button */}
            <a
              href="mailto:support@noxyai.com"
              className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <Mail className="w-5 h-5" />
              Contact Support
            </a>

            {/* Support Email */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Email us at{" "}
              <a
                href="mailto:support@noxyai.com"
                className="text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                support@noxyai.com
              </a>
            </p>

            {/* Back to Home */}
            <Link
              href="/"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          © 2025 Noxy AI. All rights reserved.
        </p>
      </div>
    </div>
  )
}
