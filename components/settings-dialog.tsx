"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Moon, Sun } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [customInstructions, setCustomInstructions] = useState("")
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Load saved instructions from localStorage
    const saved = localStorage.getItem("custom-ai-instructions")
    if (saved) {
      setCustomInstructions(saved)
    }

    // Check current theme
    const darkMode = document.documentElement.classList.contains("dark")
    setIsDark(darkMode)
  }, [open])

  const handleSave = () => {
    // Save instructions to localStorage
    localStorage.setItem("custom-ai-instructions", customInstructions)

    // Dispatch event to notify the app
    window.dispatchEvent(
      new CustomEvent("custom-instructions-updated", {
        detail: { instructions: customInstructions },
      }),
    )

    onOpenChange(false)
  }

  const handleThemeToggle = () => {
    const newDarkMode = !isDark
    setIsDark(newDarkMode)

    if (newDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // Save preference
    localStorage.setItem("theme-preference", newDarkMode ? "dark" : "light")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Theme</Label>
              <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
            </div>
            <Button variant="outline" size="icon" onClick={handleThemeToggle} className="h-10 w-10 bg-transparent">
              {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <Label htmlFor="instructions" className="text-base">
                Custom AI Instructions
              </Label>
              <p className="text-sm text-muted-foreground">
                Add your own instructions for the AI to follow in all chats
              </p>
            </div>
            <Textarea
              id="instructions"
              placeholder="Example: Always respond in a friendly tone and use simple language..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="min-h-[150px] resize-none border-green-500/50 focus-visible:ring-green-500"
              maxLength={1000}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="text-green-600 dark:text-green-400">
                These instructions will be applied to all conversations
              </span>
              <span>{customInstructions.length}/1000</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            Save Instructions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
