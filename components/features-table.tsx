"use client"
import { CheckCircle2, Zap, Globe, ImageIcon, Code } from "lucide-react"

const capabilities = [
  {
    feature: "Web Search",
    description: "Real-time information from the internet",
    icon: Globe,
    status: "Available",
  },
  {
    feature: "Image Generation",
    description: "Create images from text descriptions",
    icon: ImageIcon,
    status: "Available",
  },
  {
    feature: "Code Assistance",
    description: "Help with programming in multiple languages",
    icon: Code,
    status: "Available",
  },
  {
    feature: "Fast Responses",
    description: "Lightning-quick answers powered by AI",
    icon: Zap,
    status: "Available",
  },
]

export function FeaturesTable() {
  return (
    <section className="py-20 px-4 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Capabilities</h2>
          <p className="text-xl text-gray-400">Everything you need in one intelligent assistant</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Feature</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Description</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {capabilities.map((capability, index) => {
                const Icon = capability.icon
                return (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                          <Icon className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="font-medium text-white">{capability.feature}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-400">{capability.description}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-400">{capability.status}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
