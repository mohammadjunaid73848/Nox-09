"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language = "javascript" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [displayCode, setDisplayCode] = useState(code)
  const [originalCode] = useState(code)
  const [isDark, setIsDark] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    setIsDark(media.matches)

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    media.addEventListener("change", handler)
    return () => media.removeEventListener("change", handler)
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(displayCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const resetCode = () => setDisplayCode(originalCode)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border shadow-md ${
        isDark ? "bg-[#0d1117] border-[#30363d]" : "bg-white border-gray-200"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 ${
          isDark ? "bg-[#161b22]" : "bg-gray-50"
        } border-b ${isDark ? "border-[#30363d]" : "border-gray-200"}`}
      >
        <div
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            isDark ? "bg-[#21262d] text-gray-300" : "bg-gray-200 text-gray-700"
          }`}
        >
          {language.toUpperCase()}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className={`transition-colors text-sm px-3 py-1.5 rounded-md border ${
              isDark
                ? "bg-[#21262d] text-gray-300 border-[#30363d] hover:bg-[#30363d]"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
            title={isVisible ? "Hide code" : "Show code"}
          >
            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {displayCode !== originalCode && (
            <button
              onClick={resetCode}
              className={`transition-colors text-sm px-3 py-1.5 rounded-md border ${
                isDark
                  ? "bg-[#21262d] text-gray-300 border-[#30363d] hover:bg-[#30363d]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              ↻ Reset
            </button>
          )}

          <button
            onClick={copyToClipboard}
            className={`transition-colors text-sm px-3 py-1.5 rounded-md border ${
              copied
                ? "bg-green-500 text-white border-green-500"
                : isDark
                  ? "bg-[#21262d] text-gray-300 border-[#30363d] hover:bg-[#30363d]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Code Section */}
      {isVisible && (
        <div className={`overflow-x-auto transition-colors duration-300 ${isDark ? "bg-[#0d1117]" : "bg-gray-50"}`}>
          <pre className="p-4 text-sm leading-relaxed min-w-full whitespace-pre">
            <code className="font-mono text-[15px] break-words">{displayCode}</code>
          </pre>
        </div>
      )}
      {!isVisible && (
        <div
          className={`p-4 text-sm text-muted-foreground flex items-center justify-center min-h-[100px] ${isDark ? "bg-[#0d1117]" : "bg-gray-50"}`}
        >
          Code hidden - click the eye icon to reveal
        </div>
      )}
    </motion.div>
  )
}
