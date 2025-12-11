"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, X, Code, Eye, Wand2 } from "lucide-react"

interface CodeTestModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
  language: string
  onCodeUpdate?: (code: string) => void
}

export function CodeTestModal({ isOpen, onClose, code, language, onCodeUpdate }: CodeTestModalProps) {
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code")
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string>("")
  const [editedCode, setEditedCode] = useState(code)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    setEditedCode(code)
  }, [code])

  const runCode = () => {
    setIsRunning(true)
    setError("")
    setActiveTab("preview")

    try {
      if (!iframeRef.current) return

      const iframe = iframeRef.current
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

      if (!iframeDoc) {
        setError("Failed to access iframe document")
        setIsRunning(false)
        return
      }

      let fullHTML = editedCode.trim()

      // Check if it's already a complete HTML document
      const isCompleteHTML = fullHTML.toLowerCase().includes("<!doctype") || fullHTML.toLowerCase().startsWith("<html")

      if (language === "javascript" || language === "js") {
        fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; margin: 0; }
  </style>
</head>
<body>
  <div id="output"></div>
  <script>
    try {
      ${editedCode}
    } catch (err) {
      document.getElementById('output').innerHTML = '<div style="color: red; padding: 10px; border: 1px solid red; border-radius: 4px;">Error: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`
      } else if (language === "css") {
        fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
    ${editedCode}
  </style>
</head>
<body>
  <h1>CSS Preview</h1>
  <p>Your CSS has been applied to this page.</p>
  <button>Sample Button</button>
  <div class="container">
    <div class="box">Box 1</div>
    <div class="box">Box 2</div>
    <div class="box">Box 3</div>
  </div>
</body>
</html>`
      } else if (!isCompleteHTML) {
        // Wrap partial HTML in basic structure
        fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; margin: 0; }
  </style>
</head>
<body>
  ${editedCode}
</body>
</html>`
      }
      // If it's already complete HTML, use it as-is

      iframeDoc.open()
      iframeDoc.write(fullHTML)
      iframeDoc.close()

      setIsRunning(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsRunning(false)
    }
  }

  const applyChanges = () => {
    if (onCodeUpdate) {
      onCodeUpdate(editedCode)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Test & Debug Code
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button onClick={runCode} disabled={isRunning} size="sm" className="gap-2">
                <Play className="w-4 h-4" />
                {isRunning ? "Running..." : "Run Code"}
              </Button>
              {editedCode !== code && (
                <Button onClick={applyChanges} size="sm" variant="default" className="gap-2">
                  <Wand2 className="w-4 h-4" />
                  Apply Changes
                </Button>
              )}
              <Button onClick={onClose} size="sm" variant="ghost">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            onClick={() => setActiveTab("code")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "code"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code className="w-4 h-4 inline mr-2" />
            Code
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "preview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "code" ? (
            <div className="h-full overflow-auto">
              <textarea
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm bg-card border-none outline-none resize-none"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="h-full overflow-auto bg-white">
              {error ? (
                <div className="p-6">
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <h3 className="text-sm font-semibold mb-2 text-destructive">Error</h3>
                    <pre className="text-xs whitespace-pre-wrap font-mono text-destructive">{error}</pre>
                  </div>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  className="w-full h-full border-none"
                  title="Code Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
          <p>
            <strong>Tip:</strong> Edit the code in the Code tab, then click "Run Code" to see the preview. Supports
            HTML, CSS, and JavaScript.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
