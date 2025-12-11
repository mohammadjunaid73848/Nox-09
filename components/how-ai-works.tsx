"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Brain, Zap, Shield, Network, Lightbulb, Cpu } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "Natural Language Processing",
    description: "Advanced NLP algorithms understand context and nuance in human language",
  },
  {
    icon: Zap,
    title: "Machine Learning",
    description: "Continuous learning from interactions to improve responses",
  },
  {
    icon: Network,
    title: "Multi-model Integration",
    description: "Leverage the best AI models for different tasks",
  },
  {
    icon: Lightbulb,
    title: "Context Awareness",
    description: "Maintain conversation context for coherent discussions",
  },
  {
    icon: Shield,
    title: "Safety & Ethics",
    description: "Built-in safeguards to ensure responsible AI usage",
  },
  {
    icon: Cpu,
    title: "Real-time Processing",
    description: "Lightning-fast responses powered by optimized infrastructure",
  },
]

export function HowAIWorks() {
  const [visibleCards, setVisibleCards] = useState<boolean[]>(new Array(features.length).fill(false))

  useEffect(() => {
    features.forEach((_, index) => {
      setTimeout(() => {
        setVisibleCards((prev) => {
          const newState = [...prev]
          newState[index] = true
          return newState
        })
      }, index * 100)
    })
  }, [])

  return (
    <section className="py-20 px-4 border-t border-white/5 bg-gradient-to-b from-black to-gray-900/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full border border-white/20 text-sm text-gray-400 mb-6">
            [ HOW IT WORKS ]
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-6">How AI Powers Noxy</h2>
          <p className="text-xl text-gray-400 text-center max-w-2xl mx-auto">
            Discover the cutting-edge technology behind our intelligent assistant
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`transition-all duration-500 transform ${
                  visibleCards[index] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <Card className="h-full p-6 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
