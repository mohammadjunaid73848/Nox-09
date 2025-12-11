"use client"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MarkdownRendererProps {
  content: string
  isDark?: boolean
}

export function MarkdownRenderer({ content, isDark = false }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-foreground" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-base font-semibold mt-3 mb-2 text-foreground" {...props} />,
          h5: ({ node, ...props }) => <h5 className="text-sm font-semibold mt-2 mb-1 text-foreground" {...props} />,
          h6: ({ node, ...props }) => (
            <h6 className="text-sm font-semibold mt-2 mb-1 text-muted-foreground" {...props} />
          ),

          p: ({ node, ...props }) => <p className="mb-4 leading-7 text-foreground" {...props} />,

          ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-6 mb-4 space-y-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-2" {...props} />,
          li: ({ node, ...props }) => <li className="leading-7 text-foreground" {...props} />,

          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/50 rounded-r-lg italic text-muted-foreground"
              {...props}
            />
          ),

          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "")
            const language = match ? match[1] : ""

            if (!inline && language) {
              return (
                <div className="my-4 rounded-lg overflow-hidden border border-border">
                  <div className="bg-muted px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border">
                    {language}
                  </div>
                  <SyntaxHighlighter
                    style={isDark ? oneDark : oneLight}
                    language={language}
                    PreTag="div"
                    className="!m-0 !bg-transparent"
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      background: "transparent",
                      fontSize: "0.875rem",
                    }}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              )
            }

            // Inline code
            return (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground border border-border"
                {...props}
              >
                {children}
              </code>
            )
          },

          table: ({ node, ...props }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-muted" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="divide-y divide-border" {...props} />,
          tr: ({ node, ...props }) => <tr className="border-b border-border" {...props} />,
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
          ),
          td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-foreground" {...props} />,

          a: ({ node, ...props }) => (
            <a
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          hr: ({ node, ...props }) => <hr className="my-6 border-border" {...props} />,

          strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-foreground" {...props} />,

          img: ({ node, ...props }) => (
            <img className="max-w-full h-auto rounded-lg my-4 border border-border" {...props} alt={props.alt || ""} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
