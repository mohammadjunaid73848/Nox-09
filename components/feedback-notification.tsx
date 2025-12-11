"use client"

import { useEffect, useState } from "react"
import { X, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FeedbackNotification() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed the notification in this session
    const hasSeenNotification = sessionStorage.getItem("feedback-notification-seen")

    if (!hasSeenNotification) {
      // Show notification after 2 seconds
      const timer = setTimeout(() => {
        setShow(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    sessionStorage.setItem("feedback-notification-seen", "true")
  }

  const handleFeedback = () => {
    const feedbackUrl = process.env.NEXT_PUBLIC_FEEDBACK_URL || "https://forms.gle/your-feedback-form"
    window.open(feedbackUrl, "_blank", "noopener,noreferrer")
    handleDismiss()
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-start gap-3">
        <MessageSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">Help us improve!</h3>
          <p className="text-xs opacity-90 mb-3">Share your feedback and help make Noxy AI better for everyone.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleFeedback} className="text-xs h-7 px-3">
              Give Feedback
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs h-7 px-3 text-primary-foreground hover:bg-primary-foreground/20"
            >
              Maybe Later
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-6 w-6 flex-shrink-0 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
