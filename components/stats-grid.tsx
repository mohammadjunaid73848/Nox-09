"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Users, Zap, Clock, TrendingUp } from "lucide-react"

interface Stat {
  label: string
  value: string
  change: string
  icon: React.ReactNode
  color: string
}

const stats: Stat[] = [
  {
    label: "Active Users",
    value: "2.4M",
    change: "+12.5%",
    icon: <Users className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    label: "API Calls/Day",
    value: "48.2M",
    change: "+8.2%",
    icon: <Zap className="w-6 h-6" />,
    color: "from-purple-500 to-pink-500",
  },
  {
    label: "Avg Response",
    value: "245ms",
    change: "-5.3%",
    icon: <Clock className="w-6 h-6" />,
    color: "from-green-500 to-emerald-500",
  },
  {
    label: "Uptime",
    value: "99.99%",
    change: "+0.01%",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "from-orange-500 to-red-500",
  },
]

export function StatsGrid() {
  const [visibleStats, setVisibleStats] = useState<boolean[]>([])

  useEffect(() => {
    stats.forEach((_, index) => {
      setTimeout(() => {
        setVisibleStats((prev) => {
          const newStats = [...prev]
          newStats[index] = true
          return newStats
        })
      }, index * 150)
    })
  }, [])

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300 ${
            visibleStats[index] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>{stat.icon}</div>
            <span className="text-sm font-semibold text-green-400">{stat.change}</span>
          </div>
          <h3 className="text-gray-400 text-sm mb-2">{stat.label}</h3>
          <p className="text-2xl font-bold text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
