"use client"

import { useState, useRef, useEffect } from "react"
import { X, Copy, Edit2, Download, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const [error, setError] = useState("")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditedCode(code)
    setError("")
  }, [code, language])

  useEffect(() => {
    if (!isEditing && iframeRef.current) {
      executeCode()
    }
  }, [isEditing, language])

  const executeCode = () => {
    if (!iframeRef.current) return

    try {
      setError("")

      if (language === "html" || language === "javascript") {
        iframeRef.current.srcDoc = editedCode
      } else if (language === "mermaid") {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
              <style>
                body { margin: 0; padding: 20px; background: #1a1a1a; font-family: sans-serif; }
                .mermaid { display: flex; justify-content: center; }
              </style>
            </head>
            <body>
              <div class="mermaid">
${editedCode}
              </div>
              <script>
                mermaid.initialize({ startOnLoad: true, theme: 'dark' })
                mermaid.contentLoaded()
              </script>
            </body>
          </html>
        `
        iframeRef.current.srcDoc = html
      } else if (language === "circuitikz" || language === "latex") {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
              <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
              <style>
                body { margin: 0; padding: 20px; background: #f5f5f5; font-family: sans-serif; }
                .container { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              </style>
            </head>
            <body>
              <div class="container">
                <div>
                  \\begin{tikzpicture}
${editedCode}
                  \\end{tikzpicture}
                </div>
              </div>
              <script>
                MathJax = { tex: { inlineMath: [['$', '$'], ['\\\$$', '\\\$$']] } }
              </script>
            </body>
          </html>
        `
        iframeRef.current.srcDoc = html
      } else if (language === "tailwind" || language === "css") {
        const html = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
${language === "css" ? editedCode : ""}
              </style>
            </head>
            <body class="bg-white">
              <div id="app"></div>
              <script>
                document.getElementById('app').innerHTML = \`
                  <div class="p-8">
                    <h1 class="text-3xl font-bold mb-4">Tailwind CSS Preview</h1>
                    <p class="text-gray-600">Your Tailwind code is rendered above</p>
                  </div>
                \`
              </script>
            </body>
          </html>
        `
        iframeRef.current.srcDoc = html
      } else if (language === "python") {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { margin: 0; padding: 20px; background: #1a1a1a; color: #fff; font-family: monospace; }
                .error { color: #ff6b6b; }
              </style>
            </head>
            <body>
              <div class="error">Python execution not available in browser. Use the code download feature to run locally.</div>
            </body>
          </html>
        `
        iframeRef.current.srcDoc = html
      } else {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { margin: 0; padding: 20px; background: #1a1a1a; color: #fff; font-family: monospace; }
                pre { background: #2a2a2a; padding: 15px; border-radius: 8px; overflow-x: auto; }
              </style>
            </head>
            <body>
              <pre>${escapeHtml(editedCode)}</pre>
            </body>
          </html>
        `
        iframeRef.current.srcDoc = html
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute code")
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const extensions: { [key: string]: string } = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      html: "html",
      css: "css",
      tailwind: "html",
      mermaid: "mmd",
      circuitikz: "tex",
      latex: "tex",
      json: "json",
      xml: "xml",
      sql: "sql",
      bash: "sh",
    }
    const ext = extensions[language.toLowerCase()] || "txt"
    const element = document.createElement("a")
    const file = new Blob([editedCode], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `code.${ext}`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleSave = () => {
    setIsEditing(false)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40 transition-opacity" onClick={onClose} />

      {/* Canvas Modal - Full screen with responsive layout */}
      <div className="fixed inset-0 md:inset-4 bg-background border border-border rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0 bg-muted/30">
          <div className="flex items-center gap-3">
            <Code2 className="w-5 h-5 text-primary" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
              <span className="text-xs font-semibold text-muted-foreground">Language:</span>
              <span className="text-sm font-mono font-semibold text-primary">{language}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={isEditing ? handleSave : handleEdit} className="gap-2">
              <Edit2 className="w-4 h-4" />
              {isEditing ? "Preview" : "Edit"}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy code" size="sm">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} title="Download code" size="sm">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex gap-0">
          {/* Editor */}
          {isEditing && (
            <div className="flex-1 overflow-auto border-r border-border bg-muted/50">
              <textarea
                ref={textareaRef}
                value={editedCode}
                onChange={(e) => {
                  setEditedCode(e.target.value)
                  setError("")
                }}
                className="w-full h-full p-4 font-mono text-sm bg-transparent border-none focus:outline-none resize-none text-foreground placeholder-muted-foreground"
                spellCheck="false"
                placeholder="Write your code here..."
              />
            </div>
          )}

          {/* Preview/Output */}
          {!isEditing && (
            <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 flex flex-col">
              {error && (
                <div className="p-4 bg-destructive/10 border-b border-destructive text-destructive">
                  <p className="text-sm font-medium">Error: {error}</p>
                </div>
              )}
              <iframe
                ref={iframeRef}
                className="flex-1 border-none w-full h-full bg-white dark:bg-slate-950"
                title="Code preview"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                onLoad={() => executeCode()}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 flex-shrink-0 flex justify-between items-center bg-muted/30">
          <div className="text-xs text-muted-foreground">
            {isEditing ? "Click Preview to see changes" : "Live preview enabled"}
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => executeCode()}>
                Refresh
              </Button>
            )}
            <Button onClick={onClose} size="sm">
              {isEditing ? "Save & Close" : "Close"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
