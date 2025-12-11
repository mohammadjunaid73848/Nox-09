"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const supabase = createClient()

      try {
        // Check if user is authenticated after email confirmation
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) throw error

        if (user) {
          setStatus("success")
          setMessage("Your email has been successfully verified!")
          // Redirect to home after 2 seconds
          setTimeout(() => {
            router.push("/")
          }, 2000)
        } else {
          setStatus("error")
          setMessage("Unable to verify your email. Please try again.")
        }
      } catch (error) {
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "An error occurred during verification")
      }
    }

    handleEmailConfirmation()
  }, [router])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {status === "loading" && <Loader2 className="w-16 h-16 text-primary animate-spin" />}
              {status === "success" && <CheckCircle2 className="w-16 h-16 text-green-500" />}
              {status === "error" && <XCircle className="w-16 h-16 text-red-500" />}
            </div>
            <CardTitle className="text-2xl">
              {status === "loading" && "Verifying Email"}
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
            <CardDescription>{message || "Please wait while we verify your email..."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {status === "success" && (
              <p className="text-sm text-center text-muted-foreground">Redirecting you to the app...</p>
            )}
            {status === "error" && (
              <div className="flex flex-col gap-2">
                <Link href="/auth/login">
                  <Button variant="default" className="w-full">
                    Go to Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button variant="outline" className="w-full bg-transparent">
                    Try Signing Up Again
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
