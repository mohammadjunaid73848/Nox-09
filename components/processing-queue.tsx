"use client"

import { useState, useEffect } from "react"

interface Agent {
  name: string
  timeLeft: number
  progress: number
}

export function ProcessingQueue() {
  const [mainProgress, setMainProgress] = useState(0)
  const [agents, setAgents] = useState<Agent[]>([
    { name: "AGENT 1", timeLeft: 4, progress: 75 },
    { name: "AGENT 2", timeLeft: 5, progress: 60 },
    { name: "AGENT 3", timeLeft: 6, progress: 45 },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setMainProgress((prev) => (prev >= 100 ? 0 : prev + 2))
      setAgents((prev) =>
        prev.map((agent) => ({
          ...agent,
          progress: agent.progress >= 100 ? 0 : agent.progress + Math.random() * 3,
          timeLeft: Math.max(0, agent.timeLeft - 0.05),
        })),
      )
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const ProgressBar = ({ progress }: { progress: number }) => {
    const dots = Array.from({ length: 40 }, (_, i) => i < Math.floor((progress / 100) * 40))
    return (
      <div className="flex overflow-x-auto pb-1">
        {dots.map((filled, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all flex-shrink-0 ${filled ? "bg-orange-500" : "bg-gray-700"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-8 overflow-x-hidden">
      {/* Main Processing */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse flex-shrink-0"></div>
            <span className="text-base md:text-lg font-semibold truncate">PROCESSING</span>
          </div>
          <span className="text-xs md:text-sm text-gray-400 flex-shrink-0">~ 05 MIN LEFT</span>
        </div>
        <div className="overflow-x-auto">
          <ProgressBar progress={mainProgress} />
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {agents.map((agent, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                <span className="font-semibold text-xs md:text-sm truncate">{agent.name}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-2 md:mb-3">
              ~ {agent.timeLeft.toFixed(0).padStart(2, "0")} MIN LEFT
            </p>
            <div className="overflow-x-auto">
              <ProgressBar progress={agent.progress} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
