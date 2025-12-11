"use client"

import type React from "react"
import { useEffect, useRef } from "react"

interface VoiceParticleOrbProps {
  isActive: boolean
  audioFrequency?: number
  isDarkMode?: boolean
}

export const VoiceParticleOrb: React.FC<VoiceParticleOrbProps> = ({
  isActive,
  audioFrequency = 0,
  isDarkMode = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Inject styles for the orb animations
    if (!document.getElementById("voice-orb-styles")) {
      const style = document.createElement("style")
      style.id = "voice-orb-styles"
      style.textContent = `
        .voice-orb-container {
          position: relative;
          width: 200px;
          height: 200px;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          border-radius: 50%;
          rotate: 90deg;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.3s ease;
        }

        .voice-orb-container.active {
          opacity: 1;
        }

        .voice-orb {
          position: absolute;
          width: 200px;
          aspect-ratio: 1;
          border-radius: 50%;
          background: ${isDarkMode ? "#060606" : "#f5f5f5"};
          filter: blur(24px);
          transition: all 0.3s ease;
        }

        .voice-orb-inner {
          position: absolute;
          left: -120%;
          top: -25%;
          width: 160%;
          aspect-ratio: 1;
          border-radius: 50%;
          animation: voice-full-rotate 6s linear infinite;
          transition: all 0.3s ease;
          clip-path: polygon(
            50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
            50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
          );
        }

        .voice-orb-inner:nth-child(2) {
          left: auto;
          right: -120%;
          top: auto;
          bottom: -25%;
          animation-duration: 8s;
          clip-path: polygon(
            20% 0%, 0% 20%, 30% 50%, 0% 80%, 20% 100%,
            50% 70%, 80% 100%, 100% 80%, 70% 50%, 100% 20%,
            80% 0%, 50% 30%
          );
        }

        @keyframes voice-full-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `
      document.head.appendChild(style)
    }

    const setupAudioContext = async () => {
      if (!isActive || audioContextRef.current) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        const source = audioContext.createMediaStreamSource(stream)

        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.8
        source.connect(analyser)

        audioContextRef.current = audioContext
        analyserRef.current = analyser

        updateOrbVisuals()
      } catch (err) {
        console.error("Audio context setup error:", err)
      }
    }

    const updateOrbVisuals = () => {
      if (!analyserRef.current || !containerRef.current) return

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)

      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
      }
      const average = sum / dataArray.length

      const normalizedVolume = average / 255
      const scaledVolume = Math.pow(normalizedVolume, 0.4) // High sensitivity

      // Map volume (0-1) to hue (240/Blue to 0/Red)
      let hue = 240 - scaledVolume * 240
      hue = Math.max(0, Math.min(240, hue))

      const color1HSL = `hsl(${hue}, 100%, 60%)`
      const color2HSL = `hsl(${(hue + 180) % 360}, 100%, 60%)`

      // Size scaling
      const newSize = 200 + scaledVolume * 40
      const newShadowIntensity = 10 + scaledVolume * 25

      const orbContainer = containerRef.current.querySelector(".voice-orb-container") as HTMLElement
      const inner1 = containerRef.current.querySelector(".voice-orb-inner:nth-child(1)") as HTMLElement
      const inner2 = containerRef.current.querySelector(".voice-orb-inner:nth-child(2)") as HTMLElement

      if (orbContainer) {
        orbContainer.style.width = `${newSize}px`
        orbContainer.style.height = `${newSize}px`
        orbContainer.style.filter = `drop-shadow(0 0 ${newShadowIntensity}px ${color1HSL}bb) drop-shadow(0 0 ${newShadowIntensity}px ${color2HSL}bb)`
      }

      if (inner1) inner1.style.background = color1HSL
      if (inner2) inner2.style.background = color2HSL

      animationRef.current = requestAnimationFrame(updateOrbVisuals)
    }

    if (isActive) {
      setupAudioContext()
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    // Create orb HTML
    container.innerHTML = `
      <div class="voice-orb-container ${isActive ? "active" : ""}">
        <div class="voice-orb">
          <div class="voice-orb-inner"></div>
          <div class="voice-orb-inner"></div>
        </div>
      </div>
    `
  }, [isActive, isDarkMode])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  )
}
