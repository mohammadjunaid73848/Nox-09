"use client"

import { useState } from "react"
import { ChevronDown, Lock, Brain } from "lucide-react"

export type ModelId = string

export const MODEL_OPTIONS: {
  id: ModelId
  name: string
  label: string
  description?: string
  isReasoning?: boolean
  isCoding?: boolean
  isPro?: boolean
  isThinking?: boolean // Add thinking capability flag
}[] = [
  {
    id: "auto",
    name: "Auto (Recommended)",
    label: "Auto (Recommended)",
    description: "Picks the best model based on your message",
    isPro: true,
  },
  {
    id: "nvidia-deepseek-r1",
    name: "DeepSeek R1 (NVIDIA)",
    label: "DeepSeek R1 (NVIDIA)",
    description: "Advanced reasoning model with thinking steps",
    isReasoning: true,
    isThinking: true, // Mark as thinking model
    isPro: false,
  },
  {
    id: "nvidia-deepseek-v3.1",
    name: "DeepSeek V3.1 Terminus (NVIDIA)",
    label: "DeepSeek V3.1 Terminus (NVIDIA)",
    description: "Latest DeepSeek model with enhanced reasoning capabilities",
    isReasoning: true,
    isThinking: true, // Mark as thinking model
    isPro: true,
  },
  {
    id: "nvidia-qwen-235b",
    name: "Qwen 235B A22B (NVIDIA)",
    label: "Qwen 235B A22B (NVIDIA)",
    description: "Large reasoning model with exceptional performance",
    isReasoning: true,
    isThinking: true, // Mark as thinking model
    isPro: true,
  },
  {
    id: "zai-glm-4.6",
    name: "zai-glm-4.6",
    label: "zai-glm-4.6",
    description: "Advanced coding model for deep code generation",
    isCoding: true,
    isPro: true,
  },
  {
    id: "qwen-3-235b-a22b-instruct-2507",
    name: "Qwen3-235B Instruct (2507)",
    label: "Qwen3-235B Instruct (2507)",
    description: "High-quality general chat",
    isPro: true,
  },
  {
    id: "qwen-3-32b",
    name: "Qwen-3-32B",
    label: "Qwen-3-32B",
    description: "Solid general model with thinking capability",
    isThinking: true, // Qwen-3-32B supports thinking via Cerebras
    isPro: false,
  },
  {
    id: "grok-gpt-oss-120b",
    name: "GPT OSS 120B (Grok)",
    label: "GPT OSS 120B (Grok)",
    description: "Open-source 120B model via Groq",
    isPro: true,
  },
  {
    id: "grok-gpt-oss-20b",
    name: "GPT OSS 20B (Grok)",
    label: "GPT OSS 20B (Grok)",
    description: "Open-source 20B model via Groq",
    isPro: true,
  },
  {
    id: "grok-qwen-3-32b",
    name: "Qwen 3 32B (Grok)",
    label: "Qwen 3 32B (Grok)",
    description: "Qwen 3 via Groq",
    isPro: true,
  },
  {
    id: "gpt-oss-120b",
    name: "GPT-OSS-120B",
    label: "GPT-OSS-120B",
    description: "Open-source general model with thinking",
    isThinking: true, // Cerebras supports thinking
    isPro: false,
  },
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B (Together)",
    label: "Llama 3.3 70B (Together)",
    description: "General reasoning and chat",
    isPro: true,
  },
]

export function ModelPicker({
  value,
  onChange,
  isPro = false,
}: {
  value: ModelId
  onChange: (m: ModelId) => void
  isPro?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = MODEL_OPTIONS.find((m) => m.id === value) ?? MODEL_OPTIONS[0]

  const handleModelSelect = (model: (typeof MODEL_OPTIONS)[0]) => {
    if (model.isPro && !isPro) {
      window.location.href = "/pricing"
      return
    }
    onChange(model.id)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-transparent hover:bg-accent transition-colors duration-200 animate-fade-in"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select AI model"
      >
        <span className="max-w-[150px] sm:max-w-none truncate">{selected.label}</span>
        <ChevronDown className="w-4 h-4 opacity-70 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-20 w-72 max-h-[70vh] overflow-auto rounded-xl border bg-background shadow-lg animate-fade-in"
          >
            {MODEL_OPTIONS.map((m, index) => {
              const isLocked = m.isPro && !isPro
              return (
                <li
                  key={m.id}
                  role="option"
                  aria-selected={m.id === selected.id}
                  className={`px-4 py-3 cursor-pointer transition-all duration-200 first:rounded-t-xl last:rounded-b-xl animate-fade-in ${
                    m.id === selected.id ? "bg-accent" : "hover:bg-accent"
                  } ${isLocked ? "opacity-60" : ""}`}
                  style={{ animationDelay: `${index * 20}ms` }}
                  onClick={() => handleModelSelect(m)}
                >
                  <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                    <span className="break-words">{m.label}</span>
                    {m.isThinking && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded animate-pulse flex-shrink-0 flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        THINKING
                      </span>
                    )}
                    {m.isReasoning && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded animate-pulse flex-shrink-0">
                        REASONING
                      </span>
                    )}
                    {m.isCoding && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded flex-shrink-0">
                        CODING
                      </span>
                    )}
                    {isLocked && (
                      <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded flex-shrink-0">
                        <Lock className="w-3 h-3" />
                        PRO
                      </span>
                    )}
                  </div>
                  {m.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 break-words">{m.description}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
