"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface AgeVerificationDialogProps {
  isOpen: boolean
  onSubmit: (age: number) => void
  onClose?: () => void
}

export function AgeVerificationDialog({ isOpen, onSubmit, onClose }: AgeVerificationDialogProps) {
  const [age, setAge] = useState("")
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ageNum = Number.parseInt(age)

    if (isNaN(ageNum) || ageNum < 16) {
      setError("You must be at least 16 years old to use this service")
      return
    }

    if (ageNum > 120) {
      setError("Please enter a valid age")
      return
    }

    onSubmit(ageNum)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Age Verification Required</h2>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          To continue using Noxy AI, please confirm that you are at least 16 years old.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="age" className="block text-sm font-medium mb-2">
              Your Age
            </label>
            <input
              id="age"
              type="number"
              min="16"
              max="120"
              value={age}
              onChange={(e) => {
                setAge(e.target.value)
                setError("")
              }}
              placeholder="Enter your age"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>

          <Button type="submit" className="w-full">
            Confirm Age
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          By confirming, you agree to our{" "}
          <a href="/terms" className="underline hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}
