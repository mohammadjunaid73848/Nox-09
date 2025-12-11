"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { TrendingUp, Zap, Brain } from "lucide-react"

interface AIModel {
  name: string
  capability: string
  speed: number
  accuracy: number
  cost: string
  icon: React.ReactNode
}

const models: AIModel[] = [
  {
    name: "GPT-4 Turbo",
    capability: "Advanced Reasoning",
    speed: 95,
    accuracy: 98,
    cost: "$0.03/1K",
    icon: <Brain className="w-5 h-5" />,
  },
  {
    name: "Claude 3 Opus",
    capability: "Long Context",
    speed: 92,
    accuracy: 97,
    cost: "$0.015/1K",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    name: "Gemini Ultra",
    capability: "Multimodal",
    speed: 98,
    accuracy: 96,
    cost: "$0.01/1K",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    name: "Llama 2 70B",
    capability: "Open Source",
    speed: 88,
    accuracy: 94,
    cost: "Free",
    icon: <Brain className="w-5 h-5" />,
  },
]

export function AIModelsTable() {
  const [visibleRows, setVisibleRows] = useState<boolean[]>([])

  useEffect(() => {
    models.forEach((_, index) => {
      setTimeout(() => {
        setVisibleRows((prev) => {
          const newRows = [...prev]
          newRows[index] = true
          return newRows
        })
      }, index * 100)
    })
  }, [])

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Model</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Capability</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Speed</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Accuracy</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Cost</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, index) => (
              <tr
                key={index}
                className={`border-b border-white/5 hover:bg-white/5 transition-all duration-300 ${
                  visibleRows[index] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="text-blue-400">{model.icon}</div>
                    <span className="font-medium text-white">{model.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-300">{model.capability}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${visibleRows[index] ? model.speed : 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">{model.speed}%</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${visibleRows[index] ? model.accuracy : 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">{model.accuracy}%</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
                    {model.cost}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
