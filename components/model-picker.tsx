"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export type ModelId = string

export const MODEL_OPTIONS: {
  id: ModelId
  name: string
  label: string
  description?: string
  isPro?: boolean
}[] = [
  {
    id: "nvidia-cosmos-reason2-8b",
    name: "NVIDIA Cosmos Reason 2.0 8B",
    label: "NVIDIA Cosmos Reason 2.0 8B",
    description: "Advanced image analysis and reasoning model",
    isPro: false,
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
            {MODEL_OPTIONS.map((m, index) => (
              <li
                key={m.id}
                role="option"
                aria-selected={m.id === selected.id}
                className={`px-4 py-3 cursor-pointer transition-all duration-200 first:rounded-t-xl last:rounded-b-xl animate-fade-in ${
                  m.id === selected.id ? "bg-accent" : "hover:bg-accent"
                }`}
                style={{ animationDelay: `${index * 20}ms` }}
                onClick={() => handleModelSelect(m)}
              >
                <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                  <span className="break-words">{m.label}</span>
                </div>
                {m.description && (
                  <div className="text-xs text-muted-foreground mt-0.5 break-words">{m.description}</div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
