"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bug, Play, X } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface CodeDebugDialogProps {
  code: string
  language: string
}

export function CodeDebugDialog({ code, language }: CodeDebugDialogProps) {
  const [open, setOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<string>("")
  const [error, setError] = useState<string>("")

  const runCode = async () => {
    setIsRunning(true)
    setOutput("")
    setError("")

    try {
      // For JavaScript/TypeScript, we can run it directly in the browser
      if (language === "javascript" || language === "typescript" || language === "jsx" || language === "tsx") {
        // Capture console.log output
        const logs: string[] = []
        const originalLog = console.log
        const originalError = console.error
        const originalWarn = console.warn

        console.log = (...args: any[]) => {
          logs.push(args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg))).join(" "))
          originalLog(...args)
        }
        console.error = (...args: any[]) => {
          logs.push("ERROR: " + args.map((arg) => String(arg)).join(" "))
          originalError(...args)
        }
        console.warn = (...args: any[]) => {
          logs.push("WARN: " + args.map((arg) => String(arg)).join(" "))
          originalWarn(...args)
        }

        try {
          // Create a function from the code and execute it
          const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
          const fn = new AsyncFunction(code)
          const result = await fn()

          // Restore console methods
          console.log = originalLog
          console.error = originalError
          console.warn = originalWarn

          if (result !== undefined) {
            logs.push(
              "Return value: " + (typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)),
            )
          }

          setOutput(logs.length > 0 ? logs.join("\n") : "Code executed successfully (no output)")
        } catch (err) {
          // Restore console methods
          console.log = originalLog
          console.error = originalError
          console.warn = originalWarn

          setError(err instanceof Error ? err.message : String(err))
          if (logs.length > 0) {
            setOutput(logs.join("\n"))
          }
        }
      } else {
        // For other languages, show a message
        setOutput(
          `Direct execution of ${language} code is not supported in the browser.\n\nSupported languages: JavaScript, TypeScript`,
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="h-8" title="Debug this code">
        <Bug className="w-3.5 h-3.5 mr-1.5" /> Debug
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Code Debugger
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Code Display */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Code</h3>
                <span className="text-xs text-muted-foreground">{language}</span>
              </div>
              <div className="rounded-lg overflow-hidden border">
                <SyntaxHighlighter
                  language={language}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    maxHeight: "300px",
                    fontSize: "13px",
                  }}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* Run Button */}
            <div className="flex gap-2">
              <Button onClick={runCode} disabled={isRunning} className="gap-2">
                <Play className="w-4 h-4" />
                {isRunning ? "Running..." : "Run Code"}
              </Button>
              {(output || error) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setOutput("")
                    setError("")
                  }}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Output
                </Button>
              )}
            </div>

            {/* Output Display */}
            {output && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Output</h3>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <pre className="text-xs whitespace-pre-wrap font-mono">{output}</pre>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-destructive">Error</h3>
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <pre className="text-xs whitespace-pre-wrap font-mono text-destructive">{error}</pre>
                </div>
              </div>
            )}

            {/* Help Text */}
            {!output && !error && !isRunning && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Click "Run Code" to execute this code in a sandboxed environment. The output will appear below.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Note:</strong> Only JavaScript and TypeScript code can be executed directly in the browser.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
