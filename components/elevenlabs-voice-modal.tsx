"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Loader2 } from "lucide-react"
import { VoiceParticleOrb } from "./voice-particle-orb"

interface ElevenLabsVoiceModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  onMessageReceived?: (message: string) => void
  onUserSpoke?: (text: string) => void
  onConnectionStatusChange?: (connected: boolean) => void
  onAudioFrequency?: (frequency: number) => void
}

export const ElevenLabsVoiceModal: React.FC<ElevenLabsVoiceModalProps> = ({
  isOpen,
  onClose,
  agentId,
  onMessageReceived,
  onUserSpoke,
  onConnectionStatusChange,
  onAudioFrequency,
}) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [audioFrequency, setAudioFrequency] = useState(0)
  const [status, setStatus] = useState("Ready to start")
  const conversationRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isOpen) {
      // Cleanup on close
      if (isConnected && conversationRef.current) {
        conversationRef.current.endSession()
        setIsConnected(false)
      }
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isOpen, isConnected])

  useEffect(() => {
    onConnectionStatusChange?.(isConnected)
  }, [isConnected, onConnectionStatusChange])

  useEffect(() => {
    onAudioFrequency?.(audioFrequency)
  }, [audioFrequency, onAudioFrequency])

  const startVoiceChat = async () => {
    setIsConnecting(true)
    setStatus("Initializing...")

    try {
      // Request microphone permission
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      // Setup audio frequency monitoring
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      if (!analyserRef.current && streamRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(streamRef.current)
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        source.connect(analyserRef.current)

        // Monitor audio frequency for particle orb
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        monitorIntervalRef.current = setInterval(() => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray)
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length / 255
            const newFrequency = Math.min(average, 1)
            setAudioFrequency(newFrequency)
          }
        }, 50)
      }

      // Dynamically import and initialize ElevenLabs Conversation
      const { Conversation } = await import("@elevenlabs/client")

      console.log("[v0] Starting ElevenLabs conversation with agent:", agentId)

      // For public agents, initialize directly with agent ID
      conversationRef.current = await Conversation.startSession({
        agentId: agentId,
        connectionType: "webrtc",
        onConnect: () => {
          console.log("[v0] Connected to ElevenLabs agent")
          setIsConnected(true)
          setStatus("Connected. Speak now!")
        },
        onDisconnect: () => {
          console.log("[v0] Disconnected from agent")
          setIsConnected(false)
          setStatus("Disconnected")
        },
        onModeChange: (mode: any) => {
          setStatus(`Agent is ${mode.mode}`)
        },
        onMessage: (message: any) => {
          if (message.type === "assistant") {
            onMessageReceived?.(message.content || message.text)
          }
        },
        onUserMessage: (message: any) => {
          onUserSpoke?.(message.content || message.text)
        },
        onError: (error: any) => {
          console.error("[v0] ElevenLabs error:", error)
          setStatus("Error connecting")
        },
      })

      setIsConnecting(false)
    } catch (error) {
      console.error("[v0] Failed to start voice chat:", error)
      setStatus("Failed to connect")
      setIsConnecting(false)

      // Cleanup on error
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }

  const stopVoiceChat = () => {
    if (conversationRef.current) {
      conversationRef.current.endSession()
      conversationRef.current = null
    }
    setIsConnected(false)
    setStatus("Ready to start")

    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current)
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl overflow-hidden">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Talk with AI</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content with particle orb */}
        <div className="p-6 space-y-4">
          <div className="h-80 rounded-lg overflow-hidden border border-border/50 bg-white">
            <VoiceParticleOrb isActive={isConnected} audioFrequency={audioFrequency} />
          </div>

          {/* Status text */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium">{status}</p>
            {isConnected && <p className="text-xs text-green-600 mt-1 animate-pulse">● Connected</p>}
          </div>

          {/* Control button */}
          <Button
            onClick={isConnected ? stopVoiceChat : startVoiceChat}
            className="w-full"
            size="lg"
            disabled={isConnecting}
            variant={isConnected ? "destructive" : "default"}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : isConnected ? (
              "Stop Chat"
            ) : (
              "Start Voice Chat"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
