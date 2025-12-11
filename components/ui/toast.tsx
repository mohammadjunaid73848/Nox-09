"use client"

import * as React from "react"
import { X } from "lucide-react"

export interface ToastProps {
  message: string
  onClose: () => void
}

export function Toast({ message, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 2000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-foreground text-background px-4 py-2.5 rounded-full shadow-lg flex items-center gap-3 min-w-[200px] justify-center">
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="hover:opacity-70 transition-opacity -mr-1" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
