"use client"
import { useState, useEffect, useCallback, memo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { SimpleCodeBlock } from "./simple-code-block"

const FAMOUS_PERSONALITIES = [
  {
    name: "Prophet Muhammad",
    honorific: "صلی اللہ علیہ وسلم",
    aliases: ["Muhammad", "Mohammad", "Mohammed", "Prophet", "Hazrat Muhammad"],
  },
  { name: "Jesus Christ", honorific: "عليه السلام", aliases: ["Jesus", "Christ"] },
  { name: "Moses", honorific: "عليه السلام", aliases: ["Moses"] },
  { name: "Abraham", honorific: "عليه السلام", aliases: ["Abraham", "Ibrahim"] },
  { name: "David", honorific: "عليه السلام", aliases: ["David", "Daoud"] },
  { name: "Solomon", honorific: "عليه السلام", aliases: ["Solomon", "Sulaiman"] },
  { name: "Ali ibn Abi Talib", honorific: "رضي الله عنه", aliases: ["Ali", "Hazrat Ali"] },
  { name: "Fatimah", honorific: "رضي الله عنها", aliases: ["Fatimah"] },
  { name: "Aisha", honorific: "رضي الله عنها", aliases: ["Aisha"] },
]

interface MessageContentProps {
  content: string
  isStreaming?: boolean
  onCanvasOpen?: (code: string, language: string) => void
}

const MessageContent = memo(function MessageContent({
  content,
  isStreaming = false,
  onCanvasOpen,
}: MessageContentProps) {
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

  const highlightUrls = useCallback((text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.replace(urlRegex, (url) => `[${url}](${url})`)
  }, [])

  const highlightPersonalities = useCallback((text: string) => {
    let processedText = text

    FAMOUS_PERSONALITIES.forEach((personality) => {
      personality.aliases.forEach((alias) => {
        const regex = new RegExp(`\\b${alias}\\b`, "gi")
        processedText = processedText.replace(regex, (match) => {
          return `**[${personality.name}](personality:${personality.name})**`
        })
      })
    })

    return processedText
  }, [])

  const processedContent = highlightPersonalities(highlightUrls(content))

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("[v0] Failed to copy:", err)
    }
  }, [content])

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="sm"
        onClick={copyToClipboard}
        className="absolute top-0 right-0 h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-1" /> Copied
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-1" /> Copy
          </>
        )}
      </Button>

      <div className="max-w-none text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none select-text">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "")
              const code = String(children || "")
              const language = match?.[1] || "text"

              if (!inline) {
                return (
                  <div className="relative group/code">
                    <SimpleCodeBlock code={code} language={language} />
                  </div>
                )
              }

              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[0.875em] border border-border"
                  {...props}
                >
                  {children}
                </code>
              )
            },
            a({ href, children }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  {children}
                </a>
              )
            },
            table({ children }) {
              return (
                <div className="overflow-x-auto my-4 rounded-lg border border-border">
                  <table className="w-full text-sm border-collapse">{children}</table>
                </div>
              )
            },
            thead({ children }) {
              return <thead className="bg-muted">{children}</thead>
            },
            tbody({ children }) {
              return <tbody className="divide-y divide-border">{children}</tbody>
            },
            tr({ children }) {
              return <tr className="border-b border-border last:border-0">{children}</tr>
            },
            th({ children }) {
              return <th className="px-4 py-3 text-left font-semibold text-foreground">{children}</th>
            },
            td({ children }) {
              return <td className="px-4 py-3 text-foreground">{children}</td>
            },
            h1({ children }) {
              return <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground">{children}</h1>
            },
            h2({ children }) {
              return <h2 className="text-xl font-bold mt-5 mb-3 text-foreground">{children}</h2>
            },
            h3({ children }) {
              return <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground">{children}</h3>
            },
            h4({ children }) {
              return <h4 className="text-base font-semibold mt-3 mb-2 text-foreground">{children}</h4>
            },
            strong({ children }) {
              if (typeof children === "string" && children.startsWith("[") && children.includes("](personality:")) {
                const personality = FAMOUS_PERSONALITIES.find((p) => children.includes(p.name))
                if (personality) {
                  return (
                    <span
                      className="font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100/30 dark:bg-yellow-900/20 px-1 rounded hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30 transition-colors cursor-help relative group/personality"
                      title={personality.honorific}
                    >
                      <span className="font-semibold">{personality.name}</span>
                      {personality.honorific && (
                        <span className="text-xs ml-1 font-arabic" dir="rtl">
                          {personality.honorific}
                        </span>
                      )}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/personality:block bg-black dark:bg-white text-white dark:text-black text-xs px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                        Famous Personality
                      </span>
                    </span>
                  )
                }
              }
              return <strong className="font-bold text-foreground">{children}</strong>
            },
            em({ children }) {
              return <em className="italic text-foreground">{children}</em>
            },
            ul({ children }) {
              return <ul className="list-disc pl-6 space-y-2 my-4">{children}</ul>
            },
            ol({ children }) {
              return <ol className="list-decimal pl-6 space-y-2 my-4">{children}</ol>
            },
            li({ children }) {
              return <li className="leading-7 text-foreground">{children}</li>
            },
            p({ children }) {
              return <p className="mb-4 leading-7 text-foreground">{children}</p>
            },
            blockquote({ children }) {
              return (
                <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/50 rounded-r-lg italic text-muted-foreground">
                  {children}
                </blockquote>
              )
            },
            hr() {
              return <hr className="my-6 border-border" />
            },
            img({ src, alt }) {
              const handleImageClick = () => {
                if (src) {
                  const event = new CustomEvent("show-image-popup", {
                    detail: { url: src },
                  })
                  window.dispatchEvent(event)
                }
              }

              return (
                <img
                  src={src || "/placeholder.svg"}
                  alt={alt || ""}
                  className="max-w-full h-auto rounded-lg my-4 border border-border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={handleImageClick}
                />
              )
            },
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  )
})

MessageContent.displayName = "MessageContent"

export { MessageContent }
