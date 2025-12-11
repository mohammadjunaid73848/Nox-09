"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Loader2 } from "lucide-react"

export default function SharePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Processing shared content...")
  const supabase = createClient()

  useEffect(() => {
    handleSharedContent()
  }, [])

  const handleSharedContent = async () => {
    try {
      const title = searchParams.get("title")
      const text = searchParams.get("text")
      const url = searchParams.get("url")

      console.log("[v0] Share page params:", { title, text, url })

      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setStatus("Please log in first...")
        setTimeout(() => router.push("/auth/login"), 1500)
        return
      }

      let message = ""
      if (title) message += `${title}\n\n`
      if (text) message += text
      if (url) message += `${text ? "\n\n" : ""}${url}`

      if (!message.trim()) {
        setStatus("No content to share")
        setTimeout(() => router.push("/chat"), 1500)
        return
      }

      try {
        sessionStorage.setItem("shared_content", message.trim())
        console.log("[v0] Shared content stored successfully")
      } catch (storageError) {
        console.error("[v0] SessionStorage error:", storageError)
        // Fallback: use a shorter version if storage fails
        sessionStorage.setItem("shared_content", message.trim().slice(0, 5000))
      }

      setStatus("Opening chat...")
      setTimeout(() => {
        router.push("/chat")
      }, 500)
    } catch (error) {
      console.error("[v0] Error in share handler:", error)
      setStatus("Error processing shared content. Redirecting...")
      setTimeout(() => router.push("/chat"), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-lg text-foreground">{status}</p>
        <p className="text-sm text-muted-foreground">Please wait while we process your shared content...</p>
      </div>
    </div>
  )
}
