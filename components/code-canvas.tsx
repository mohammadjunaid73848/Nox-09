"use client"

import { useState, useRef, useEffect } from "react"
import { X, Copy, Edit2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SimpleCodeBlock } from "./simple-code-block"

interface CodeCanvasProps {
  isOpen: boolean
  onClose: () => void
  code: string
  language: string
}

export function CodeCanvas({ isOpen, onClose, code, language }: CodeCanvasProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedCode, setEditedCode] = useState(code)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEditedCode(code)
  }, [code])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([editedCode], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `code.${getFileExtension(language)}`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const getFileExtension = (lang: string) => {
    const extensions: { [key: string]: string } = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      html: "html",
      css: "css",
      json: "json",
      xml: "xml",
      sql: "sql",
      bash: "sh",
      text: "txt",
    }
    return extensions[lang.toLowerCase()] || "txt"
  }

  const renderPreview = () => {
    if (language === "html" || language === "javascript") {
      return (
        <iframe
          srcDoc={editedCode}
          className="w-full h-full border-none rounded-lg"
          title="Canvas preview"
          sandbox="allow-scripts allow-same-origin"
        />
      )
    }

    // For diagram languages
    if (language === "mermaid") {
      return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground text-sm">Mermaid diagram preview would render here</p>
        </div>
      )
    }

    if (language === "circuitikz") {
      return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground text-sm">Circuit diagram would render here</p>
        </div>
      )
    }

    return (
      <div className="w-full h-full flex items-center justify-center p-4 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground text-sm">Preview not available for this language</p>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Canvas Modal */}
      <div className="fixed inset-4 md:inset-8 bg-background border border-border rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
              <span className="text-xs font-semibold text-muted-foreground">Language:</span>
              <span className="text-sm font-mono font-semibold">{language}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} className="gap-2">
              <Edit2 className="w-4 h-4" />
              {isEditing ? "Preview" : "Edit"}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy code">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} title="Download code">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex gap-0">
          {/* Editor or Code Display */}
          <div className="flex-1 overflow-auto border-r border-border">
            {isEditing ? (
              <textarea
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm bg-transparent border-none focus:outline-none resize-none"
                spellCheck="false"
              />
            ) : (
              <div className="p-4">
                <SimpleCodeBlock code={editedCode} language={language} />
              </div>
            )}
          </div>

          {/* Preview */}
          {!isEditing && <div className="flex-1 overflow-auto bg-muted/30 p-4">{renderPreview()}</div>}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex-shrink-0 flex justify-end gap-2">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </>
  )
}
