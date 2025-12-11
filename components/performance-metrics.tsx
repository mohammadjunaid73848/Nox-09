"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

const performanceData = [
  { name: "Jan", requests: 4000, latency: 240 },
  { name: "Feb", requests: 3000, latency: 221 },
  { name: "Mar", requests: 2000, latency: 229 },
  { name: "Apr", requests: 2780, latency: 200 },
  { name: "May", requests: 1890, latency: 229 },
  { name: "Jun", requests: 2390, latency: 200 },
]

const capabilityData = [
  { name: "Text", value: 95 },
  { name: "Code", value: 92 },
  { name: "Image", value: 88 },
  { name: "Audio", value: 85 },
  { name: "Video", value: 78 },
]

export function PerformanceMetrics() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Requests Chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">API Requests Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Bar dataKey="requests" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Latency Chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Response Latency</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Line type="monotone" dataKey="latency" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Capabilities Bar Chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:col-span-2">
        <h3 className="text-lg font-semibold text-white mb-6">AI Capabilities Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={capabilityData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
            <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
