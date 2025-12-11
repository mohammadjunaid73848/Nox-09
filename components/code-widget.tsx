"use client"

import { useState } from "react"
import { X, Copy, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-mobile"

interface CodeWidgetProps {
  isOpen: boolean
  onClose: () => void
  code: string
  language: string
  appId?: string
}

export function CodeWidget({ isOpen, onClose, code, language, appId }: CodeWidgetProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const baseClasses =
    "fixed bg-background border border-border rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col"
  const mobileClasses = "bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl"
  const desktopClasses = "left-0 top-0 bottom-0 w-[45vw] rounded-r-lg"

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Code Widget */}
      <div
        className={`${baseClasses} ${isMobile ? mobileClasses : desktopClasses} ${
          isOpen ? "translate-y-0 translate-x-0" : isMobile ? "translate-y-full" : "-translate-x-full"
        } transition-transform duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{language}</span>
            {appId && <span className="text-xs text-muted-foreground">ID: {appId}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8" title="Copy code">
              <Copy className="w-4 h-4" />
            </Button>
            {appId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(`/app/${appId}`, "_blank")}
                className="h-8 w-8"
                title="Open app"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-words">
            <code>{code}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 flex-shrink-0 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1 bg-transparent">
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          {appId && (
            <Button size="sm" className="flex-1" onClick={() => window.open(`/app/${appId}`, "_blank")}>
              <Play className="w-4 h-4 mr-2" />
              Open App
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
