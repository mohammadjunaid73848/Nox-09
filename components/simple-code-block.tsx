"use client"
import { useState, useCallback, useMemo, memo, useEffect } from "react"
import { Copy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SimpleCodeBlockProps {
  code: string
  language: string
}

const SimpleCodeBlock = memo(function SimpleCodeBlock({ code, language }: SimpleCodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("[v0] Failed to copy:", err)
    }
  }, [code])

  const handleDownload = useCallback(() => {
    try {
      const element = document.createElement("a")
      const file = new Blob([code], { type: "text/plain" })
      element.href = URL.createObjectURL(file)

      // Determine file extension based on language
      const extensions: Record<string, string> = {
        html: "html",
        css: "css",
        javascript: "js",
        js: "js",
        typescript: "ts",
        tsx: "tsx",
        jsx: "jsx",
        python: "py",
        java: "java",
        cpp: "cpp",
        csharp: "cs",
        php: "php",
        ruby: "rb",
        go: "go",
        rust: "rs",
        sql: "sql",
        json: "json",
        xml: "xml",
        yaml: "yaml",
        markdown: "md",
      }

      const ext = extensions[language.toLowerCase()] || "txt"
      element.download = `code.${ext}`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      URL.revokeObjectURL(element.href)
    } catch (err) {
      console.error("[v0] Failed to download:", err)
    }
  }, [code, language])

  const lineCount = useMemo(() => code.split("\n").length, [code])

  const bgColor = isDark ? "bg-black" : "bg-white"
  const textColor = isDark ? "text-gray-200" : "text-gray-800"
  const headerBg = isDark ? "bg-gray-900" : "bg-gray-50"
  const headerText = isDark ? "text-gray-400" : "text-gray-600"

  return (
    <div className={`${bgColor} my-4 flex flex-col w-full`}>
      {/* Header - No border or shadow */}
      <div className={`${headerBg} px-4 py-3 flex items-center justify-between`}>
        <span className={`text-sm font-mono ${headerText}`}>
          {language.toUpperCase()} {lineCount} lines
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 px-2 text-xs" title="Copy code">
            {copied ? "✓ Copied" : <Copy className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8 px-2 text-xs" title="Download code">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Code Content - Full display, no max-height scrolling */}
      <div className={`${bgColor} w-full`}>
        <pre className={`p-4 font-mono text-sm ${textColor} leading-relaxed overflow-x-auto`}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
})

SimpleCodeBlock.displayName = "SimpleCodeBlock"

export { SimpleCodeBlock }
