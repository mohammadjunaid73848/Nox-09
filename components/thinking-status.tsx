"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Brain, Search, Zap, Sparkles, Eye } from "lucide-react"

interface ThinkingStep {
  action: string
  description: string
  icon: React.ReactNode
  startTime: number
}

export function ThinkingStatus({
  isVisible,
  currentAction,
  searchQuery,
}: {
  isVisible: boolean
  currentAction?: string
  searchQuery?: string
}) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    if (!isVisible) {
      setElapsedTime(0)
      return
    }

    const timeInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 100)

    return () => {
      clearInterval(timeInterval)
    }
  }, [isVisible, startTime])

  if (!isVisible) return null

  const getStepInfo = (): { icon: React.ReactNode; description: string } => {
    if (currentAction === "searching") {
      return {
        icon: <Search className="w-5 h-5 animate-pulse" />,
        description: searchQuery ? `Searching the web for "${searchQuery}"...` : "Searching the web...",
      }
    }
    if (currentAction === "synthesizing") {
      return {
        icon: <Sparkles className="w-5 h-5 animate-pulse" />,
        description: "Synthesizing insights from multiple AI models...",
      }
    }
    if (currentAction === "reasoning") {
      return {
        icon: <Zap className="w-5 h-5 animate-pulse" />,
        description: "Deep reasoning with multiple AI passes...",
      }
    }
    if (currentAction === "analyzing") {
      return {
        icon: <Eye className="w-5 h-5 animate-pulse" />,
        description: "Analyzing image with Google Gemma Vision...",
      }
    }
    return {
      icon: <Brain className="w-5 h-5 animate-spin" />,
      description: "Processing your request...",
    }
  }

  const stepInfo = getStepInfo()

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex-shrink-0 text-primary">{stepInfo.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{stepInfo.description}</p>
        <p className="text-xs text-muted-foreground mt-1">Elapsed: {elapsedTime}s</p>
      </div>
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <img
            src="/logo-black.png"
            alt="Thinking"
            className="w-5 h-5 dark:invert animate-spin"
            style={{ animationDuration: "2s" }}
          />
        </div>
      </div>
    </div>
  )
}
