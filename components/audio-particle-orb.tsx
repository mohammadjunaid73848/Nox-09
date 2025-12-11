"use client"

import { useEffect, useRef } from "react"

export function AudioParticleOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationIdRef = useRef<number | null>(null)

  interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    angle: number
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 300
    canvas.height = 300

    // Initialize audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    audioContextRef.current = audioContext

    // Get microphone access
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256

        source.connect(analyser)
        analyserRef.current = analyser

        // Initialize particles
        const particles: Particle[] = []
        for (let i = 0; i < 50; i++) {
          particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.5 + 0.5,
            angle: Math.random() * Math.PI * 2,
          })
        }
        particlesRef.current = particles

        animate()
      })
      .catch(() => {
        // Fallback animation without audio
        particlesRef.current = Array.from({ length: 50 }, () => ({
          x: canvas.width / 2,
          y: canvas.height / 2,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.5,
          angle: Math.random() * Math.PI * 2,
        }))
        animate()
      })

    function animate() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const analyser = analyserRef.current
      let audioLevel = 0.5

      if (analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(dataArray)
        audioLevel = dataArray.reduce((a, b) => a + b) / dataArray.length / 255
      }

      const particles = particlesRef.current
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const orbRadius = 50 + audioLevel * 40

      // Draw orb
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, orbRadius)
      gradient.addColorStop(0, `rgba(255, 255, 255, ${0.3 + audioLevel * 0.5})`)
      gradient.addColorStop(1, `rgba(100, 200, 255, ${0.1 + audioLevel * 0.3})`)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.beginPath()
      ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 + audioLevel * 0.5})`
      ctx.lineWidth = 2
      ctx.stroke()

      // Update and draw particles
      particles.forEach((p, i) => {
        p.angle += audioLevel * 0.1
        const dx = Math.cos(p.angle)
        const dy = Math.sin(p.angle)

        p.x += dx * audioLevel * 3 + p.vx * 0.05
        p.y += dy * audioLevel * 3 + p.vy * 0.05

        // Keep particles within bounds
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        p.x = Math.max(0, Math.min(canvas.width, p.x))
        p.y = Math.max(0, Math.min(canvas.height, p.y))

        ctx.fillStyle = `rgba(100, 200, 255, ${p.opacity * audioLevel})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationIdRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        className="rounded-full border-2 border-white/20 bg-black shadow-lg"
        style={{
          boxShadow: "0 0 30px rgba(100, 200, 255, 0.3), inset 0 0 30px rgba(100, 200, 255, 0.1)",
        }}
      />
      <p className="text-sm text-gray-400 text-center">Microphone visualization</p>
    </div>
  )
}
